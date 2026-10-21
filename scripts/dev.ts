import Ngrok from "@ngrok/ngrok";
import { execSync, spawn, ChildProcess } from "child_process";
import dotenv from "dotenv"
import fs from "fs";
import path from "path";

dotenv.config(); // Loads NGROK_AUTHTOKEN and DEV_PORT from .env

function loadVarsFile() {
  const varsPath = path.resolve(".dev.vars");
  if (fs.existsSync(varsPath)) {
    const content = fs.readFileSync(varsPath, "utf8");
    const lines = content.split("\n");
    lines.forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Load .dev.vars file to get BOT_TOKEN for webhook operations
loadVarsFile();

let ngrokUrl: string | undefined;
let webhookSet = false;
let wranglerProcess: ChildProcess | undefined;
let isShuttingDown = false;

async function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log("\nShutting down...");
  
  // 1. Delete webhook if we set it
  if (webhookSet) {
    try {
      const botToken = process.env.BOT_TOKEN;
      if (botToken) {
        console.log("Deleting Telegram webhook...");
        const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
        const deleteResponse = execSync(`curl -s ${deleteWebhookUrl}`);
        const responseObj = JSON.parse(deleteResponse.toString());
        
        if (responseObj.ok) {
          console.log("Webhook deleted successfully");
        } else {
          console.error("Failed to delete webhook:", responseObj.description);
        }
      }
    } catch (error) {
      console.error("Error deleting webhook:", error);
    }
  }
  
  // 2. Kill wrangler process
  if (wranglerProcess) {
    console.log("Stopping wrangler dev...");
    wranglerProcess.kill('SIGINT');
  }
  
  // 3. Close ngrok tunnel
  if (ngrokUrl) {
    console.log("Shutting down ngrok tunnel...");
    try {
      await Ngrok.disconnect(ngrokUrl);
      await Ngrok.kill();
      console.log("Ngrok tunnel closed");
    } catch (error) {
      console.error("Error closing ngrok tunnel:", error);
    }
  }
  
  console.log("Shutdown complete");
  process.exit(0);
}

async function startDev() {
  try {
    const devPort = parseInt(process.env.DEV_PORT || "8787", 10);
    const ngrokAuthtoken = process.env.NGROK_AUTHTOKEN;
    
    if (!ngrokAuthtoken) {
      throw new Error("NGROK_AUTHTOKEN not found in environment variables. Check your .env file.");
    }
    
    // Start ngrok tunnel
    console.log(`Starting ngrok tunnel on port ${devPort}...`);
    const session = await Ngrok.connect({
      addr: devPort,
      authtoken: ngrokAuthtoken,
    });
    
    // session is a string (the URL) in older versions or an object in newer
    // @ngrok/ngrok 0.5.x returns a string or an object depending on usage
    // Based on original code, it's expected as a string URL
    ngrokUrl = session as unknown as string;
    console.log(`Ngrok tunnel started at: ${ngrokUrl}`);
    
    // Set webhook for Telegram bot
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      throw new Error("BOT_TOKEN not found. Make sure it's set in .dev.vars file");
    }
    
    const webhookUrl = `${ngrokUrl}/webhook`;
    console.log(`Setting webhook to: ${webhookUrl}`);
    
    // Using curl to set webhook
    const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    const webhookResponse = execSync(`curl -s ${setWebhookUrl}`);
    const responseObj = JSON.parse(webhookResponse.toString());
    
    if (responseObj.ok) {
      console.log("Webhook set successfully");
      webhookSet = true;
    } else {
      throw new Error(`Failed to set webhook: ${responseObj.description}`);
    }
    
    // Start wrangler dev
    console.log(`Starting wrangler dev on port ${devPort}...`);
    wranglerProcess = spawn("pnpm", ["wrangler:dev", "--port", devPort.toString()], { 
      stdio: "inherit",
      shell: true,
    });
    
    wranglerProcess.on('exit', (code) => {
      console.log(`Wrangler process exited with code ${code}`);
      cleanup();
    });

  } catch (error) {
    console.error("Error in dev script:", error);
    await cleanup();
  }
}

// Handle graceful shutdown on SIGTERM and SIGINT
process.on('SIGTERM', () => cleanup());
process.on('SIGINT', () => cleanup());

startDev();

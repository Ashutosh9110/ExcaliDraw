import { Tool } from "@/components/Canvas";

declare global {
  interface Window {
    selectedTool: Tool;
  }
}

export {}; 
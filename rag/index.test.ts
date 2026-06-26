import { describe, it, expect, beforeAll } from "vitest";
import OpenAI from "openai";
import { embed, findBestMatch, loadOrCreateStore } from "./index";

const client = new OpenAI();
let store: { text: string; embedding: number[] }[];

beforeAll(async () => {
  store = await loadOrCreateStore(client, "weather_rules.txt");
}, 30000);

describe("RAG retrieval — user input to weather standard", () => {
  it("降雨量 90mm → 匹配大雨標準", async () => {
    const [queryEmbedding] = await embed(client, ["今天降雨量預估是 90 毫米，這樣算嚴重嗎？"]);
    const result = findBestMatch(queryEmbedding, store);
    expect(result).toContain("大雨");
  });

  it("降雨量 250mm → 匹配豪雨標準", async () => {
    const [queryEmbedding] = await embed(client, ["24 小時下了 250 毫米的雨，這算豪雨嗎？"]);
    const result = findBestMatch(queryEmbedding, store);
    expect(result).toContain("豪雨");
  });

  it("氣溫 37 度 → 匹配高溫黃色燈號", async () => {
    const [queryEmbedding] = await embed(client, ["今天氣溫 37 度，是不是很高溫？"]);
    const result = findBestMatch(queryEmbedding, store);
    expect(result).toContain("高溫黃色");
  });

  it("連續三天 37 度 → 匹配高溫橙色燈號", async () => {
    const [queryEmbedding] = await embed(client, ["已經連續三天高溫 37 度了，這樣算什麼等級？"]);
    const result = findBestMatch(queryEmbedding, store);
    expect(result).toContain("高溫橙色");
  });
});

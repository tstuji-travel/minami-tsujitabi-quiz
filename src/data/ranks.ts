import type { RankDefinition } from "../types";

export const RANKS: RankDefinition[] = [
  { id: "rank1", name: "旅のたまご", description: "旅の第一歩を踏み出した状態です。" },
  { id: "rank2", name: "見習い旅人", description: "まずはどれか1コースに挑戦した状態です。" },
  { id: "rank3", name: "旅の相棒", description: "3コースをひと通り体験し、旅の勘が育ってきた状態です。" },
  { id: "rank4", name: "旅の研究員", description: "3コースで70点以上を出し、旅の知識が安定してきた状態です。" },
  { id: "rank5", name: "旅の判断マスター", description: "判断力とKL予習で高得点を出し、経験も積んだ状態です。" },
  { id: "rank6", name: "ツジ旅ジュニア研究員", description: "全コースで高得点を取り、総合力が育った最上位ランクです." },
];

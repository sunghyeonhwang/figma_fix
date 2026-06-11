import {
  CommentCategoryDefinition,
  CommentCategoryId,
  CommentThread,
} from "../types/figma";

export const COMMENT_CATEGORIES: CommentCategoryDefinition[] = [
  {
    id: "typo",
    label: "오탈자",
    description: "철자, 맞춤법, 표기 오류",
  },
  {
    id: "spacing",
    label: "띄어쓰기",
    description: "띄어쓰기, 줄바꿈, 문장 간격",
  },
  {
    id: "copy",
    label: "문구수정",
    description: "카피, 제목, 설명 문구 변경",
  },
  {
    id: "function_error",
    label: "기능오류",
    description: "클릭, 이동, 동작, 데이터 오류",
  },
  {
    id: "change_request",
    label: "수정사항",
    description: "일반 수정 요청 또는 작업 지시",
  },
  {
    id: "design_ui",
    label: "디자인/UI",
    description: "레이아웃, 색상, 간격, 이미지, UI 상태",
  },
  {
    id: "link_button",
    label: "링크/버튼",
    description: "링크 URL, CTA, 버튼 라벨/동작",
  },
  {
    id: "schedule_info",
    label: "일정/정보",
    description: "날짜, 시간, 장소, 프로그램 정보",
  },
  {
    id: "other",
    label: "기타",
    description: "분류가 불명확한 피드백",
  },
];

const CATEGORY_META = new Map(COMMENT_CATEGORIES.map((category) => [category.id, category]));

const CATEGORY_RULES: Array<{
  category: CommentCategoryId;
  weight: number;
  keywords: string[];
}> = [
  {
    category: "typo",
    weight: 4,
    keywords: [
      "오탈자",
      "오타",
      "탈자",
      "맞춤법",
      "철자",
      "표기",
      "잘못",
      "틀림",
      "typo",
      "spell",
    ],
  },
  {
    category: "spacing",
    weight: 4,
    keywords: [
      "띄어쓰기",
      "띄어",
      "붙여",
      "붙임",
      "공백",
      "스페이스",
      "줄바꿈",
      "행간",
      "자간",
      "space",
      "line break",
    ],
  },
  {
    category: "function_error",
    weight: 4,
    keywords: [
      "기능",
      "오류",
      "에러",
      "버그",
      "안됨",
      "안 돼",
      "작동",
      "동작",
      "클릭",
      "이동",
      "열리지",
      "로딩",
      "깨짐",
      "bug",
      "error",
      "broken",
    ],
  },
  {
    category: "link_button",
    weight: 3,
    keywords: [
      "링크",
      "url",
      "href",
      "버튼",
      "cta",
      "button",
      "신청하기",
      "등록하기",
      "바로가기",
      "새창",
    ],
  },
  {
    category: "schedule_info",
    weight: 3,
    keywords: [
      "일정",
      "날짜",
      "시간",
      "장소",
      "위치",
      "프로그램",
      "세션",
      "연사",
      "스피커",
      "타임테이블",
      "schedule",
      "date",
      "time",
    ],
  },
  {
    category: "design_ui",
    weight: 3,
    keywords: [
      "디자인",
      "ui",
      "ux",
      "레이아웃",
      "여백",
      "간격",
      "정렬",
      "색상",
      "컬러",
      "폰트",
      "이미지",
      "아이콘",
      "사이즈",
      "모바일",
      "반응형",
    ],
  },
  {
    category: "copy",
    weight: 3,
    keywords: [
      "문구",
      "카피",
      "텍스트",
      "제목",
      "설명",
      "멘트",
      "워딩",
      "copy",
      "wording",
      "text",
      "headline",
    ],
  },
  {
    category: "change_request",
    weight: 2,
    keywords: [
      "수정",
      "변경",
      "교체",
      "삭제",
      "추가",
      "반영",
      "바꿔",
      "넣어",
      "빼기",
      "확인",
      "요청",
      "change",
      "update",
      "replace",
      "remove",
      "add",
    ],
  },
];

export function getCategoryDefinition(categoryId?: CommentCategoryId) {
  return CATEGORY_META.get(categoryId ?? "other") ?? CATEGORY_META.get("other")!;
}

export function classifyCommentText(text: string): {
  category: CommentCategoryId;
  confidence: number;
  reasons: string[];
} {
  const normalized = text.toLowerCase();
  const scores = new Map<CommentCategoryId, { score: number; reasons: string[] }>();

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        const current = scores.get(rule.category) ?? { score: 0, reasons: [] };
        current.score += rule.weight;
        if (current.reasons.length < 4) {
          current.reasons.push(keyword);
        }
        scores.set(rule.category, current);
      }
    }
  }

  if (scores.size === 0) {
    return {
      category: "other",
      confidence: 0.3,
      reasons: [],
    };
  }

  const ranked = Array.from(scores.entries()).sort((a, b) => b[1].score - a[1].score);
  const [category, result] = ranked[0];
  const totalScore = Array.from(scores.values()).reduce((sum, item) => sum + item.score, 0);
  const confidence = Math.min(0.95, Math.max(0.45, result.score / Math.max(totalScore, 1)));

  return {
    category,
    confidence: Number(confidence.toFixed(2)),
    reasons: result.reasons,
  };
}

export function classifyCommentThreads(threads: CommentThread[]): CommentThread[] {
  return threads.map((thread) => {
    const replyText = thread.replies.map((reply) => reply.message).join("\n");
    const classification = classifyCommentText(`${thread.message}\n${replyText}`);
    const category = getCategoryDefinition(classification.category);

    return {
      ...thread,
      category: classification.category,
      categoryLabel: category.label,
      categoryConfidence: classification.confidence,
      categoryReasons: classification.reasons,
      replies: thread.replies.map((reply) => {
        const replyClassification = classifyCommentText(reply.message);
        const replyCategory = getCategoryDefinition(replyClassification.category);

        return {
          ...reply,
          category: replyClassification.category,
          categoryLabel: replyCategory.label,
          categoryConfidence: replyClassification.confidence,
          categoryReasons: replyClassification.reasons,
        };
      }),
    };
  });
}

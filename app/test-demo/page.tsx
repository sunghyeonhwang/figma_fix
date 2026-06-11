"use client";

import { ResultsView } from "../components";
import { CommentThread, CommentAggregation } from "../lib/types/figma";
import { aggregateComments } from "../lib/utils/comment-aggregation";
import { classifyCommentThreads } from "../lib/utils/comment-classification";

// Mock comments data with different dates
const mockComments: CommentThread[] = [
  {
    id: "1",
    parentId: "",
    author: { id: "u1", name: "김철수", avatarUrl: "" },
    message: "디자인이 정말 깔끔해요! 버튼 색상만 조금 더 진하게 해주세요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    resolvedAt: null,
    isResolved: false,
    position: { x: 100, y: 200 },
    replies: [
      {
        id: "1-1",
        parentId: "1",
        author: { id: "u2", name: "이영희", avatarUrl: "" },
        message: "네, 수정하겠습니다!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        resolvedAt: null,
        isResolved: false,
        position: null,
        replies: [],
      },
    ],
  },
  {
    id: "2",
    parentId: "",
    author: { id: "u2", name: "이영희", avatarUrl: "" },
    message: "폰트 사이즈 확인 부탁드립니다. 모바일에서 너무 작아 보여요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    isResolved: true,
    position: { x: 300, y: 400 },
    replies: [],
  },
  {
    id: "3",
    parentId: "",
    author: { id: "u3", name: "박민준", avatarUrl: "" },
    message: "헤더 영역의 간격을 16px로 통일해주세요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    resolvedAt: null,
    isResolved: false,
    position: null,
    replies: [],
  },
  {
    id: "4",
    parentId: "",
    author: { id: "u1", name: "김철수", avatarUrl: "" },
    message: "좋아요! 이 디자인 승인합니다.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    isResolved: true,
    position: { x: 500, y: 600 },
    replies: [],
  },
  {
    id: "5",
    parentId: "",
    author: { id: "u4", name: "정수민", avatarUrl: "" },
    message: "아이콘 스타일이 일관되지 않아요. 전체적으로 Outlined로 통일해주세요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    isResolved: true,
    position: null,
    replies: [
      {
        id: "5-1",
        parentId: "5",
        author: { id: "u2", name: "이영희", avatarUrl: "" },
        message: "완료했습니다. 확인 부탁드려요.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        resolvedAt: null,
        isResolved: false,
        position: null,
        replies: [],
      },
    ],
  },
  {
    id: "6",
    parentId: "",
    author: { id: "u3", name: "박민준", avatarUrl: "" },
    message: "그림자 효과가 너무 강해요. 좀 더 부드럽게 해주세요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
    resolvedAt: null,
    isResolved: false,
    position: { x: 200, y: 350 },
    replies: [],
  },
];

const mockFileInfo = {
  name: "모바일 앱 디자인 v2.0",
  key: "abc123xyz",
  lastModified: new Date().toISOString(),
};

export default function TestDemoPage() {
  const classifiedComments = classifyCommentThreads(mockComments);
  const totalCount = classifiedComments.length;
  const resolvedCount = classifiedComments.filter((c) => c.isResolved).length;
  const unresolvedCount = totalCount - resolvedCount;

  // Generate aggregation data from mock comments
  const aggregation: CommentAggregation = aggregateComments(classifiedComments);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8 font-sans dark:from-zinc-950 dark:to-black">
      <div className="mx-auto flex justify-center">
        <ResultsView
          fileInfo={mockFileInfo}
          comments={classifiedComments}
          totalCount={totalCount}
          resolvedCount={resolvedCount}
          unresolvedCount={unresolvedCount}
          aggregation={aggregation}
          onBack={() => {
            window.location.href = "/";
          }}
        />
      </div>
    </div>
  );
}

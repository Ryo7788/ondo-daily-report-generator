"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "zh" | "en";

const translations = {
  en: {
    ondoReports: "Ondo Reports",
    dashboard: "Dashboard",
    status: "Status",
    generating: "Generating...",
    idle: "Idle",
    todayReportReady: "Today's report ready",
    latestReport: "Latest Report",
    noReports: "No reports",
    schedule: "Schedule",
    active: "Active",
    notLoaded: "Not loaded",
    notConfigured: "Not configured",
    apiHealth: "API Health",
    checking: "Checking...",
    quickActions: "Quick Actions",
    generateNow: "Generate Now",
    starting: "Starting...",
    viewLogs: "View Logs",
    allReports: "All Reports",
    recentReports: "Recent Reports",
    reports: "Reports",
    allGeneratedReports: "All Generated Reports",
    date: "Date",
    size: "Size",
    location: "Location",
    modified: "Modified",
    back: "Back",
    trigger: "Trigger",
    currentStatus: "Current Status",
    instantTrigger: "Instant Trigger",
    instantTriggerDesc: "Immediately start report generation with --test mode (bypasses weekend check).",
    scheduledTrigger: "Scheduled Trigger",
    scheduledTriggerDesc: "Schedule via launchd. Use +N (minutes) or HH:MM format.",
    cancelPendingTest: "Cancel Pending Test",
    logs: "Logs",
    executionLogs: "Execution Logs",
    launchdLogs: "Launchd Logs",
    all: "All",
    entries: "entries",
    previous: "Previous",
    next: "Next",
    of: "of",
    test: "Test",
    production: "Production",
    empty: "(empty)",
    tableOfContents: "Table of Contents",
    prevReport: "Previous",
    nextReport: "Next",
    noReportsYet: "No reports generated yet",
    noReportsYetDesc: "Click \"Generate Now\" on the dashboard to create your first report.",
    goToDashboard: "Go to Dashboard",
    highlights: "Highlights",
    generationProgress: "Generation Progress",
    generationComplete: "Complete",
    generationFailed: "Failed",
    phaseCheckApi: "Check API Keys",
    phaseConfirmDate: "Confirm date & market",
    phaseDataCollection: "Data collection",
    phaseGenerateDraft: "Generate draft",
    phaseQueryGrok: "Query Grok",
    phaseQueryChatGPT: "Query ChatGPT",
    phaseIntegrate: "Integrate & refine",
    phaseVerify: "Verify & output",
    stepsCompleted: "steps completed",
    abortGeneration: "Abort",
    aborting: "Aborting...",
    generationAborted: "Aborted",
  },
  zh: {
    ondoReports: "Ondo 日报",
    dashboard: "仪表盘",
    status: "状态",
    generating: "生成中...",
    idle: "空闲",
    todayReportReady: "今日日报已就绪",
    latestReport: "最新日报",
    noReports: "暂无日报",
    schedule: "定时任务",
    active: "运行中",
    notLoaded: "未加载",
    notConfigured: "未配置",
    apiHealth: "API 状态",
    checking: "检查中...",
    quickActions: "快捷操作",
    generateNow: "立即生成",
    starting: "启动中...",
    viewLogs: "查看日志",
    allReports: "全部日报",
    recentReports: "近期日报",
    reports: "日报列表",
    allGeneratedReports: "全部已生成日报",
    date: "日期",
    size: "大小",
    location: "位置",
    modified: "修改时间",
    back: "返回",
    trigger: "触发",
    currentStatus: "当前状态",
    instantTrigger: "即时触发",
    instantTriggerDesc: "立即启动日报生成（--test 模式，跳过周末检查）。",
    scheduledTrigger: "定时触发",
    scheduledTriggerDesc: "通过 launchd 定时执行。使用 +N（分钟）或 HH:MM 格式。",
    cancelPendingTest: "取消定时测试",
    logs: "日志",
    executionLogs: "执行日志",
    launchdLogs: "Launchd 日志",
    all: "全部",
    entries: "条记录",
    previous: "上一页",
    next: "下一页",
    of: "/",
    test: "测试",
    production: "生产",
    empty: "（空）",
    tableOfContents: "目录",
    prevReport: "上一篇",
    nextReport: "下一篇",
    noReportsYet: "暂无日报",
    noReportsYetDesc: "前往仪表盘点击「立即生成」来创建第一份日报。",
    goToDashboard: "前往仪表盘",
    highlights: "要点",
    generationProgress: "生成进度",
    generationComplete: "生成完成",
    generationFailed: "生成失败",
    phaseCheckApi: "检查 API Key 状态",
    phaseConfirmDate: "确认日期和市场状态",
    phaseDataCollection: "数据采集",
    phaseGenerateDraft: "生成日报初稿",
    phaseQueryGrok: "查询 Grok 社区数据",
    phaseQueryChatGPT: "查询 ChatGPT 深度分析",
    phaseIntegrate: "整合数据完善日报",
    phaseVerify: "最终验证并输出",
    stepsCompleted: "步骤已完成",
    abortGeneration: "终止生成",
    aborting: "正在终止...",
    generationAborted: "已终止",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

const LanguageContext = createContext<{
  lang: Lang;
  toggle: () => void;
}>({ lang: "zh", toggle: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "en" || saved === "zh") setLang(saved);
  }, []);

  const toggle = () => {
    setLang((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      localStorage.setItem("lang", next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  const { lang } = useContext(LanguageContext);
  return (key: TranslationKey) => translations[lang][key];
}

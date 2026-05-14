import React from "react";

interface PageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <h1
          className="text-[22px] font-bold"
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>
        {badge && <div>{badge}</div>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

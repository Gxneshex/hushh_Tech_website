import React, { KeyboardEvent, ReactNode, useId, useState } from "react";

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  tabsId?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  tabsId?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  activeTab?: string;
  tabsId?: string;
}

function tabId(tabsId: string | undefined, value: string) {
  return `${tabsId ?? "tabs"}-tab-${value}`;
}

function panelId(tabsId: string | undefined, value: string) {
  return `${tabsId ?? "tabs"}-panel-${value}`;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  children,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const tabsId = useId();

  return (
    <div className={className}>
      {React.Children.map(children, (child: any) => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab, setActiveTab, tabsId });
        }

        if (child.type === TabsContent && child.props.value === activeTab) {
          return React.cloneElement(child, { activeTab, tabsId });
        }

        return null;
      })}
    </div>
  );
};

export const TabsList: React.FC<TabsListProps> = ({
  children,
  activeTab,
  setActiveTab,
  tabsId,
}) => {
  const triggers = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement<TabsTriggerProps>[];

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % triggers.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = triggers.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();

    const nextValue = triggers[nextIndex]?.props.value;
    if (!nextValue) return;

    setActiveTab?.(nextValue);
    document.getElementById(tabId(tabsId, nextValue))?.focus();
  };

  return (
    <div role="tablist" aria-orientation="horizontal" className="flex gap-2">
      {triggers.map((child, index) =>
        React.cloneElement(child, {
          activeTab,
          setActiveTab,
          tabsId,
          onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) =>
            handleKeyDown(event, index),
        })
      )}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  activeTab,
  setActiveTab,
  tabsId,
  onKeyDown,
}) => {
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      id={tabId(tabsId, value)}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId(tabsId, value)}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab?.(value)}
      onKeyDown={onKeyDown}
      className={`px-4 py-2 rounded-lg min-h-[44px] ${
        isActive ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
      }`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  activeTab,
  tabsId,
}) => (
  <div
    id={panelId(tabsId, value)}
    role="tabpanel"
    aria-labelledby={tabId(tabsId, value)}
    tabIndex={activeTab === value ? 0 : -1}
  >
    {children}
  </div>
);

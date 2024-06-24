import {
  AppLayout,
  AppLayoutProps,
  SideNavigation,
  SideNavigationProps,
  TopNavigation,
} from "@cloudscape-design/components";
import { useRef, useState } from "react";
import SettingsModal, { SettingsModalActions } from "./SettingsModal";

const navItems: SideNavigationProps.Item[] = [
  { type: "link", text: "Database Objects", href: "/database-objects" },
];

export default function DdaAppLayout(props: AppLayoutProps) {
  const [navigationOpen, setNavigationOpen] = useState(true);
  const settingsModal = useRef<SettingsModalActions>(null);

  return (
    <>
      <TopNavigation
        identity={{
          href: "/",
          title: "Database Dependency Analyzer",
          logo: { src: "./icon.png", alt: "Service name logo" },
        }}
        utilities={[
          {
            type: "button",
            iconName: "settings",
            title: "Settings",
            ariaLabel: "Settings",
            onClick: () => settingsModal.current?.open(),
          },
        ]}
      />
      <AppLayout
        {...props}
        toolsHide={true}
        navigationOpen={navigationOpen}
        onNavigationChange={(change) => setNavigationOpen(change.detail.open)}
        navigation={
          <SideNavigation
            header={{
              href: "/",
              text: "Database Dependency Analyzer",
            }}
            activeHref={window.location.pathname}
            items={navItems}
          />
        }
      />
      <SettingsModal ref={settingsModal} />
    </>
  );
}

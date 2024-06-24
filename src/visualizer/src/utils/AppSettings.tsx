import {
  applyDensity,
  applyMode,
  Density,
  Mode,
} from "@cloudscape-design/global-styles";
import { createContext, useContext } from "react";

export function isDarkModeEnabled(): boolean {
  return JSON.parse(localStorage.getItem("dark-mode") ?? "false");
}

export function setDarkMode(
  enabled: boolean,
  appSettingsWrapper: AppSettingsWrapper,
) {
  localStorage.setItem("dark-mode", enabled.toString());
  appSettingsWrapper.updateAppSettings({
    ...appSettingsWrapper.value,
    darkModeEnabled: enabled,
  });
}

export function isCompactModeEnabled(): boolean {
  return JSON.parse(localStorage.getItem("compact-mode") ?? "false");
}

export function setCompactMode(
  enabled: boolean,
  appSettingsWrapper: AppSettingsWrapper,
) {
  localStorage.setItem("compact-mode", enabled.toString());
  appSettingsWrapper.updateAppSettings({
    ...appSettingsWrapper.value,
    compactModeEnabled: enabled,
  });
}

export function applySettings() {
  if (isDarkModeEnabled()) {
    applyMode(Mode.Dark);
  } else {
    applyMode(Mode.Light);
  }

  if (isCompactModeEnabled()) {
    applyDensity(Density.Compact);
  } else {
    applyDensity(Density.Comfortable);
  }
}

export interface AppSettings {
  darkModeEnabled: boolean;
  compactModeEnabled: boolean;
}

export interface AppSettingsWrapper {
  value: AppSettings;
  updateAppSettings: (appSettings: AppSettings) => void;
}

export const defaultAppSettings: AppSettings = {
  darkModeEnabled: isDarkModeEnabled(),
  compactModeEnabled: isCompactModeEnabled(),
};

const AppSettingsContext = createContext<AppSettingsWrapper | undefined>(
  undefined,
);

export function useAppSettings() {
  const appSettings = useContext(AppSettingsContext);
  if (appSettings === undefined) {
    throw new Error("No settings context set, use SettomgsProvider to set one");
  }
  return appSettings;
}

type AppSettingsProviderProps = {
  appSettings: AppSettings;
  updateAppSettings: (appSettings: AppSettings) => void;
  children: React.ReactNode;
};
export function AppSettingsProvider({
  appSettings,
  updateAppSettings,
  children,
}: AppSettingsProviderProps) {
  return (
    <AppSettingsContext.Provider
      value={{
        value: appSettings,
        updateAppSettings,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

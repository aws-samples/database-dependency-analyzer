import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.en";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./components/home/Home";
import DatabaseObjects from "./components/database-objects/DatabaseObjects";
import ErrorPage from "./components/common/ErrorPage";
import {
  AppSettings,
  AppSettingsProvider,
  applySettings,
  defaultAppSettings,
} from "./utils/AppSettings";
import { useState } from "react";

const LOCALE = "en";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/database-objects",
    element: <DatabaseObjects />,
  },
]);

export default function App() {
  const [appSettings, setAppSettings] =
    useState<AppSettings>(defaultAppSettings);
  applySettings();

  return (
    <I18nProvider locale={LOCALE} messages={[messages]}>
      <AppSettingsProvider
        appSettings={appSettings}
        updateAppSettings={setAppSettings}
      >
        <RouterProvider router={router} />
      </AppSettingsProvider>
    </I18nProvider>
  );
}

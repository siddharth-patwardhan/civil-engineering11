import { Outlet } from "react-router-dom";
import Layout from "./LayoutNew";
import { DarkModeProvider } from "./DarkModeProvider";
import { ToastProvider } from "./ToastProvider";
import { FloatingAssistant } from "./FloatingAssistant";

export function AppShell() {
  return (
    <DarkModeProvider>
      <ToastProvider>
        <Layout>
          <Outlet />
        </Layout>
        <FloatingAssistant context="general" />
      </ToastProvider>
    </DarkModeProvider>
  );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ProjectProvider } from "./context/ProjectContext.jsx";
import { TaskProvider } from "./context/TaskContext.jsx";
import { NoteProvider } from "./context/NoteContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { SuperAdminProvider } from "./context/SuperAdminContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <UserProvider>
            <ProjectProvider>
              <TaskProvider>
                <NoteProvider>
                  <SuperAdminProvider>
                    <>
                      <App />
                      <Toaster
                        position="top-right"
                        toastOptions={{
                          style: {
                            background: "hsl(var(--card))",
                            color: "hsl(var(--foreground))",
                            border: "1px solid hsl(var(--border))",
                          },
                        }}
                      />
                    </>
                  </SuperAdminProvider>
                </NoteProvider>
              </TaskProvider>
            </ProjectProvider>
          </UserProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

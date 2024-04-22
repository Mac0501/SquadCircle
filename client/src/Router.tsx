import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Registration from "./pages/Registration";

const Login = React.lazy(() => import("./pages/Login"));

export const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registration/:code" element={<Registration />} />
          <Route path="/*" element={<ProtectedRoute/>}/>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Login = React.lazy(() => import("./pages/Login"));
const Registration = React.lazy(() => import("./pages/Registration"));
const ProtectedRoute = React.lazy(() => import("./components/ProtectedRoute"));

export const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{backgroundColor:"#101010"}}></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registration/:code" element={<Registration />} />
          <Route path="/*" element={<ProtectedRoute/>}/>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

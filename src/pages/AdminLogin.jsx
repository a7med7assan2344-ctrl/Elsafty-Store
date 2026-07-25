import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function AdminLogin({ setAdmin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setAdmin(true);

    } catch (error) {
      alert("بيانات الدخول غير صحيحة");
      console.log(error);
    }
  };


  return (
    <div style={{
      width:"350px",
      margin:"100px auto",
      textAlign:"center"
    }}>

      <h2>Admin Login</h2>

      <form onSubmit={login}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{width:"100%",padding:"10px",margin:"10px"}}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          style={{width:"100%",padding:"10px",margin:"10px"}}
        />

        <button style={{
          padding:"10px 30px",
          cursor:"pointer"
        }}>
          Login
        </button>

      </form>

    </div>
  );
}
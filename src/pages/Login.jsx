import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword
} from "firebase/auth";

import { auth } from "../firebase";

function Login() {

  const navigate = useNavigate();

  const [email,setEmail]=useState("");

  const [password,setPassword]=useState("");

  const [loading,setLoading]=useState(false);

  const login = async(e)=>{

    e.preventDefault();

    try{

      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      navigate("/");

    }

    catch(err){

      alert("بيانات الدخول غير صحيحة");

    }

    finally{

      setLoading(false);

    }

  };

  return(

    <div className="auth-page">

      <form
        className="auth-form"
        onSubmit={login}
      >

        <h2>

          تسجيل الدخول

        </h2>

        <input

          type="email"

          placeholder="البريد الإلكتروني"

          value={email}

          onChange={(e)=>setEmail(e.target.value)}

          required

        />

        <input

          type="password"

          placeholder="كلمة المرور"

          value={password}

          onChange={(e)=>setPassword(e.target.value)}

          required

        />

        <button>

          {

            loading

            ?

            "جارى الدخول..."

            :

            "دخول"

          }

        </button>

        <p>

          ليس لديك حساب؟

          <Link to="/register">

            إنشاء حساب

          </Link>

        </p>

      </form>

    </div>

  );

}

export default Login;
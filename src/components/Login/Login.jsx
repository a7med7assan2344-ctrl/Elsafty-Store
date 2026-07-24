import React, {useState} from "react";

function Login({setLogin}){

const [username,setUsername] = useState("");
const [password,setPassword] = useState("");


const handleLogin = ()=>{

if(username==="admin" && password==="123456"){

localStorage.setItem("adminLogin","true");

setLogin(true);

}

else{

alert("بيانات الدخول غير صحيحة");

}

};


return(

<div
style={{
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
direction:"rtl"
}}
>


<div>

<h2>
تسجيل دخول الإدارة
</h2>


<input

placeholder="اسم المستخدم"

value={username}

onChange={(e)=>setUsername(e.target.value)}

/>


<br/><br/>


<input

type="password"

placeholder="كلمة المرور"

value={password}

onChange={(e)=>setPassword(e.target.value)}

/>


<br/><br/>


<button

onClick={handleLogin}

>

دخول

</button>


</div>


</div>

)


}

export default Login;
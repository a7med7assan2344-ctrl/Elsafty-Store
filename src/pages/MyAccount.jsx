import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function MyAccount() {

  const { user, logout } = useContext(AuthContext);

  return (

    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px"
      }}
    >

      <h2>حسابي</h2>

      <p>
        <strong>الاسم:</strong>{" "}
        {user?.displayName || "غير موجود"}
      </p>

      <p>
        <strong>الإيميل:</strong>{" "}
        {user?.email}
      </p>

      <button
        onClick={logout}
      >
        تسجيل الخروج
      </button>

    </div>

  );

}

export default MyAccount;
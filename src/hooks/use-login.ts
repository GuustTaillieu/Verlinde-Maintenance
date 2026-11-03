import { useState } from "react";

export function useLogin() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const login = () => {
    }

    return {
        email,
        setEmail,
        password,
        setPassword,
        login
    }
}
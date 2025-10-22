import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginType, loginSchema } from "@refeel/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { FirebaseAuthAdapter } from "@/lib/firebase";

const useLogin = () => {
	const navigate = useNavigate();

	const [isError, setIsError] = useState(false);

	const loginForm = useForm<LoginType>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginType) => {
		console.log(data);
		const firebaseAuth = new FirebaseAuthAdapter();
		try {
			await firebaseAuth.signInWithEmail(data.email, data.password);
			navigate("/");
		} catch {
			setIsError(true);
		}
	};
	return {
		loginForm,
		onSubmit,
		isError,
	};
};

export default useLogin;

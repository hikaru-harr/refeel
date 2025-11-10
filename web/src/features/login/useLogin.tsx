import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginType, loginSchema } from "@refeel/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { FirebaseAuthAdapter } from "@/lib/firebase";

const useLogin = () => {
	const navigate = useNavigate();

	const [requestState, setRequestState] = useState({ isLoading: false, isError: false })

	const loginForm = useForm<LoginType>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginType) => {
		setRequestState((current) => ({ ...current, isLoading: true }))
		const firebaseAuth = new FirebaseAuthAdapter();
		try {
			await firebaseAuth.signInWithEmail(data.email, data.password);
			navigate("/");
		} catch {
			setRequestState(() => ({ isError: true, isLoading: false }))
		}
	};
	return {
		loginForm,
		onSubmit,
		requestState,
	};
};

export default useLogin;

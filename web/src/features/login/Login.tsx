// src/pages/Login.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FirebaseAuthAdapter } from "@/lib/firebase";

const loginSchema = z.object({
	email: z.email(),
	password: z.string(),
});

type LoginType = z.infer<typeof loginSchema>;

export default function Login() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
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

	return (
		<div className="w-[400px] mx-auto mt-[100px]">
			<h1 className="text-2xl font-bold text-center bg-violet-600 text-white py-2">
				ReFeel
			</h1>
			<Form {...loginForm}>
				<form
					onSubmit={loginForm.handleSubmit(onSubmit)}
					className="p-6 border border-violet-600 space-y-4"
				>
					{isError && (
						<div className="bg-red-50 w-full p-3 rounded-md border border-red-600">
							メールアドレスかパスワードが違います
						</div>
					)}

					<FormField
						control={loginForm.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										type="email"
										placeholder="メールアドレス"
										{...field}
										className="h-12"
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					<FormField
						control={loginForm.control}
						name="password"
						render={({ field }) => (
							<FormItem className="relative">
								<FormControl>
									<Input
										placeholder="*******"
										type={showPassword ? "text" : "password"}
										{...field}
										className="h-12"
									/>
								</FormControl>
								{showPassword ? (
									<button
										type="button"
										onClick={() => setShowPassword((current) => !current)}
									>
										<EyeClosed className="absolute right-3 top-3" />
									</button>
								) : (
									<button
										type="button"
										onClick={() => setShowPassword((current) => !current)}
									>
										<Eye className="absolute right-3 top-3" />
									</button>
								)}
							</FormItem>
						)}
					/>
					<Button className="w-full h-12 mt-2">LOGIN</Button>
				</form>
			</Form>
		</div>
	);
}

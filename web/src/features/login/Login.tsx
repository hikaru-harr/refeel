// src/pages/Login.tsx

import { Eye, EyeClosed, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useLogin from "./useLogin";

export default function Login() {
	const { loginForm, onSubmit, requestState } = useLogin();

	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="w-[400px] mx-auto mt-[100px]">
			<h1 className="text-2xl font-bold text-center text-violet-600 py-2">
				ReFeel.
			</h1>
			<Form {...loginForm}>
				<form
					onSubmit={loginForm.handleSubmit(onSubmit)}
					className="p-6 space-y-4"
				>
					{requestState.isError && (
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
										disabled={requestState.isLoading}
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
										disabled={requestState.isLoading}
									/>
								</FormControl>
								{showPassword ? (
									<button
										type="button"
										className="cursor-pointer"
										onClick={() => setShowPassword((current) => !current)}
										disabled={requestState.isLoading}
									>
										<EyeClosed className="absolute right-3 top-3" />
									</button>
								) : (
									<button
										type="button"
										className="cursor-pointer"
										onClick={() => setShowPassword((current) => !current)}
										disabled={requestState.isLoading}
									>
										<Eye className="absolute right-3 top-3" />
									</button>
								)}
							</FormItem>
						)}
					/>
					<Button disabled={requestState.isLoading} className="w-full h-12 mt-2 cursor-pointer">
						{requestState.isLoading && <LoaderCircle className="animate-spin" />}
						LOGIN
					</Button>
				</form>
			</Form>
		</div>
	);
}

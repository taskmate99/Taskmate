import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XInputField } from "@/components/custom/XInputField"
import { Eye, EyeOff, Mail, User, Calendar } from "lucide-react"
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text"
import { Link, useNavigate } from "react-router-dom"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormik, FormikProvider, Form } from "formik";
import * as Yup from "yup";
import axios from "axios"
import { toast } from "sonner"
import { useLocalStorage } from "@reactuses/core"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { signInWithPopup } from "firebase/auth"
import { auth, githubProvider, googleProvider } from "@/firebase/firebaseConfig"
import { useAuthStore } from "@/store/authStore"
import { useSocket } from "@/hooks/useSocket"
import { PhoneInput } from "@/components/custom/PhoneInput"

interface Payload {
    firstname: string;
    surname: string;
    email: string;
    password: string;
    dateOfBirth: string;
    mobileNumber: string;
}

const RegisterSchema = Yup.object().shape({
    firstname: Yup.string().required("First name is required"),
    surname: Yup.string().required("Surname is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number")
        .required("Password is required"),
    gender: Yup.string().required("Gender is required"),
    dateOfBirth: Yup.string()
        .required("Date of birth is required")
        .matches(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
    mobileNumber: Yup.string()
        .required("Mobile number is required")
        .matches(/^\+?\d{10,15}$/, "Mobile number must be 10-15 digits, optionally starting with +")
});

export default function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"form">) {
    const [, setValue] = useLocalStorage("email", "");
    const navigate = useNavigate()
    const [loading, setLoading] = useState({ google: false, github: false })
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuthStore()
    const { connect } = useSocket();

    const signInWithGoogle = async () => {
        try {
            setLoading({ ...loading, google: true })
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/google`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                toast.success("Login successful");
                login(response.data.user)
                connect(response.data.user.id)
                navigate("/dashboard");
            }
        } catch (error: any) {
            console.error("Frontend Google login failed:", error);
            toast.error(error.response.data.message || "Internal server error")
        }
        finally {
            setLoading({ ...loading, google: false })
        }
    };
    const signInWithGithub = async () => {
        try {
            setLoading({ ...loading, github: true })
            const result = await signInWithPopup(auth, githubProvider);
            const idToken = await result.user.getIdToken();

            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/github`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                toast.success("Login successful");
                login(response.data.user)
                connect(response.data.user.id)
                navigate("/dashboard");
            }
        } catch (error: any) {
            console.error("Frontend Github login failed:", error);
            toast.error(error.response.data.message || "Internal server error")
        }
        finally {
            setLoading({ ...loading, github: false })
        }
    };

    const handleRegister = async (values: Payload) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'https://task-mate-full-stack.onrender.com/api/v1'}/auth/register`,
                values
            )

            if (response.status === 201) {
                toast.warning("Registration successful, please verify your email")
                setValue(values.email)
                navigate('/verify-otp')
            }
        } catch (error: any) {
            toast.error(error.response.data.message || "Registration failed")
            console.error("Error registering user:", error);
        }
    }

    const formik = useFormik({
        initialValues: {
            firstname: "",
            surname: "",
            email: "",
            password: "",
            gender: "male",
            dateOfBirth: "",
            mobileNumber: "",
        },
        validationSchema: RegisterSchema,
        onSubmit: handleRegister
    });

    return (
        <>
            <FormikProvider value={formik}>
                <Form className={cn("flex flex-col gap-6", className)} {...props}>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold">
                            <AnimatedShinyText className="inline-flex items-center justify-center transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                                Register to your account
                            </AnimatedShinyText>
                        </h1>
                    </div>

                    <div className="grid gap-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <XInputField
                                id="firstname"
                                name="firstname"
                                label="First Name"
                                type="text"
                                className="h-11"
                                placeholder="John"
                                icon={<User size={20} />}
                                value={formik.values.firstname}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.firstname && formik.errors.firstname}
                            />
                            <XInputField
                                id="surname"
                                name="surname"
                                label="Surname"
                                type="text"
                                className="h-11"
                                placeholder="Gino"
                                icon={<User size={20} />}
                                value={formik.values.surname}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.surname && formik.errors.surname}
                            />
                        </div>

                        <XInputField
                            id="email"
                            name="email"
                            label="Email"
                            type="email"
                            className="h-11"
                            placeholder="m@example.com"
                            icon={<Mail size={20} />}
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.email && formik.errors.email}
                        />

                        <XInputField
                            id="password"
                            name="password"
                            label="Password"
                            className="h-11"
                            type={showPassword ? "text" : "password"}
                            icon={
                                <div className="flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            }
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && formik.errors.password}
                        />

                        <XInputField
                            id="dateOfBirth"
                            name="dateOfBirth"
                            label="Date of Birth"
                            type="date"
                            className="h-11"
                            placeholder="YYYY-MM-DD"
                            icon={<Calendar size={20} />}
                            value={formik.values.dateOfBirth}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                        />
                        <PhoneInput
                            id="mobileNumber"
                            name="mobileNumber"
                            placeholder="+91 7620798520"
                            value={formik.values.mobileNumber}
                            onChange={(value) => formik.setFieldValue("mobileNumber", value)}
                            onBlur={formik.handleBlur}
                            error={formik.touched.mobileNumber && formik.errors.mobileNumber}
                        />

                        <div className="grid gap-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                value={formik.values.gender}
                                onValueChange={(value) => formik.setFieldValue("gender", value)}
                            >
                                <SelectTrigger className="w-full py-[21px]">
                                    <SelectValue placeholder="Select a gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Gender</SelectLabel>
                                        {["male", "female", "other"].map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item.charAt(0).toUpperCase() + item.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {formik.touched.gender && formik.errors.gender && (
                                <p className="text-sm text-red-500">{formik.errors.gender}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <>
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                    Please wait...
                                </>
                            ) : (
                                "Register"
                            )}
                        </Button>

                        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                            <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                </Form>
            </FormikProvider>
            <div className="my-6 flex flex-col md:flex-row gap-4">
                {/* Google Login Button */}
                <Button
                    variant="outline"
                    className="w-full md:w-1/2 flex items-center justify-center"
                    onClick={signInWithGoogle}
                    disabled={loading.google}
                >
                    {loading.google ? <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                        Please wait...
                    </> : <>   <svg
                        className={`h-5 w-5`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                    >
                        <path
                            fill="#EA4335"
                            d="M24 9.5c3.07 0 5.84 1.06 8.01 2.8l5.98-5.98C33.25 2.58 28.87.5 24 .5 14.85.5 6.98 6.4 3.5 14.26l7.32 5.69C12.65 13.44 17.91 9.5 24 9.5z"
                        />
                        <path
                            fill="#34A853"
                            d="M24 44c5.91 0 10.89-1.95 14.52-5.3l-6.86-5.63c-2.02 1.35-4.59 2.17-7.66 2.17-6.05 0-11.18-4.08-13.02-9.59l-7.35 5.7C7.01 39.73 14.9 44 24 44z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M10.98 25.65c-.48-1.45-.75-3-.75-4.65s.27-3.2.75-4.65l-7.32-5.69A20.49 20.49 0 0 0 2 21c0 3.22.77 6.27 2.11 8.99l7.35-5.7z"
                        />
                        <path
                            fill="#4285F4"
                            d="M47.5 24c0-1.58-.14-3.11-.39-4.59H24v9.19h13.31c-.57 2.88-2.16 5.33-4.55 6.99l6.86 5.63C44.74 37.05 47.5 31.08 47.5 24z"
                        />
                    </svg>
                        Login with Google</>}

                </Button>

                {/* GitHub Login Button */}
                <Button
                    variant="outline"
                    className="w-full md:w-1/2 flex items-center justify-center"
                    onClick={signInWithGithub}
                    disabled={loading.github}
                >
                    {loading.github ? <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                        Please wait...
                    </> : <>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className={`h-5 w-5`}
                            fill="currentColor"
                        >
                            <path
                                d="M12 .297C5.373.297 0 5.67 0 12.297c0 5.303 3.438 
      9.8 8.205 11.385.6.113.82-.258.82-.577 
      0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 
      18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 
      1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 
      2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 
      0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 
      0 0 1.005-.322 3.3 1.23.96-.267 
      1.98-.399 3-.405 1.02.006 2.04.138 
      3 .405 2.28-1.552 3.285-1.23 
      3.285-1.23.645 1.653.24 2.873.12 
      3.176.765.84 1.23 1.91 1.23 3.22 
      0 4.61-2.805 5.625-5.475 
      5.92.42.36.81 1.096.81 2.22 
      0 1.606-.015 2.896-.015 3.286 
      0 .315.21.69.825.57C20.565 
      22.092 24 17.592 24 12.297 
      24 5.67 18.627.297 12 .297z"
                            />
                        </svg>
                        Login with GitHub</>}
                </Button>
            </div>

            <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to='/login' className="underline underline-offset-4">Login</Link>
            </div>
        </>
    )
}
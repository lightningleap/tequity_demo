import { Link } from "react-router-dom"
import { SignUpForm } from "../components/signupform"

export default function SignUp() {

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-bold text-gray-900">TEQUITY</span>
          </Link>
        </div>
      </nav>

      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-8 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Create your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <SignUpForm />

          <p className="mt-10 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/signin" className="font-semibold leading-6 text-pink-500 hover:text-pink-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { Link } from "react-router-dom"
import {SignInForm} from "../components/signinform"

export default function SignIn() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-bold text-gray-900">TEQUITY</span>
          </Link>
        </div>
      </nav>

      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <SignInForm />

          <p className="mt-10 text-center text-sm text-gray-500">
            Not a member?{" "}
            <Link to="/signup" className="font-semibold leading-6 text-pink-500 hover:text-pink-600">
              Start a 14 day free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

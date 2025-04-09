//Google Icons: https://www.iconfinder.com/icons/7123025/logo_google_g_icon
"use client";
import Image from "next/image";

export default function SignIn() {
    return (
        <div className="bg-[#46708D] h-screen w-screen flex flex-col justify-center items-center">
            <header className="justify-center items-center flex flex-col mb-10 relative mt-30">
                <Image src="/assets/frey-trade.png" alt="Frey Trade Logo" width={200} height={200} className="relative z-0" />
                <h1 className="text-4xl text-[#C4BB96] absolute z-[1] top-3/4 transform -translate-y-1/2 translate-x-8 w-75">FREY TRADE</h1>
            </header>
            <main className="items-center flex flex-col mb-40">
                <input 
                    type="email" 
                    placeholder="E-MAIL" 
                    className="p-4 w-100 h-10 border-[#A57730] border-2 rounded-md mb-5 justify-center items-center text-center text-[#C4BB96] placeholder:text-center placeholder:text-[#C4BB96]" 
                    required
                />
                <input 
                    type="password" 
                    placeholder="PASSWORD" 
                    className="p-4 w-100 h-10 border-[#A57730] border-2 rounded-md mb-5 justify-center items-center text-center text-[#C4BB96] placeholder:text-center placeholder:text-[#C4BB96] " 
                    required
                />
                <button className="bg-[#A57730] text-black font-bold py-2 px-4 rounded-md" >SIGN IN</button>
                <div className="h-0 w-100 border-[#C4BB96] border-1 rounded-full mt-5"></div>
                <button className="bg-white text-black font-bold p-2 rounded-md mt-5 w-30 flex items-center justify-center">SIGN IN<Image src="/assets/7123025_logo_google_g_icon.png" alt="Google Icon" width={36} height={36} className="ml-2"/>{/*https://www.iconfinder.com/icons/7123025/logo_google_g_icon*/}</button>
                <div className="h-0 w-100 border-[#C4BB96] border-1 rounded-full mt-5"></div>
                <p className="text-[#C4BB96] mt-10">DON'T HAVE AN ACCOUNT?</p>
                <button className="text-[#C4BB96] border-b-2">SIGN UP</button>

            </main>
        </div>
    );
}
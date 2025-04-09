export default function SignUp() {
    return (
        <div className="bg-[#46708D] h-screen w-screen flex flex-col justify-center items-center">
            <header className="justify-center items-center flex flex-col mb-10 relative mt-30">
                <img src="/assets/frey-trade.png" alt="Frey Trade Logo" width="200" height="200" className="relative z-0"/>
                <h1 className="text-4xl text-[#C4BB96] absolute z-1 top-3/4 transform -translate-y-1/2 translate-x-21 w-100">FREY TRADE</h1>
            </header>
            <main className="items-center flex flex-col mb-40">
                <input 
                    type="email" 
                    placeholder="E-MAIL" 
                    className="p-4 w-100 h-10 border-[#A57730] border-2 rounded-md mb-5 justify-center items-center text-center placeholder:text-center placeholder:text-[#C4BB96]" 
                    required
                />
                <input 
                    type="password" 
                    placeholder="PASSWORD" 
                    className="p-4 w-100 h-10 border-[#A57730] border-2 rounded-md mb-5 justify-center items-center text-center placeholder:text-center placeholder:text-[#C4BB96] " 
                    required
                />
                <input 
                    placeholder="SECURITY QUESTION"
                    className="p-4 w-100 h-10 border-[#A57730] border-2 rounded-md mb-5 justify-center items-center text-center placeholder:text-center placeholder:text-[#C4BB96] "
                    required
                />
                <input placeholder="SECURITY ANSWER"
                    className="p-4 w-100 h-10 border-[#A57730] border-2 rounded-md mb-5 justify-center items-center text-center placeholder:text-center placeholder:text-[#C4BB96] "
                    required
                />
                <button className="bg-[#A57730] text-black font-bold py-2 px-4 rounded-md" >SIGN UP</button>
                <div className="h-0 w-100 border-[#C4BB96] border-1 rounded-full mt-5"></div>
                <button className="bg-white text-black font-bold p-2 rounded-md mt-5 w-30 flex items-center justify-center">SIGN IN<img src="/assets/7123025_logo_google_g_icon.png" width="36" height="36" className="ml-2"/>{/*https://www.iconfinder.com/icons/7123025/logo_google_g_icon*/}</button>
            </main>
        </div>
    );
}
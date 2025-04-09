"use client";

import Image from "next/image";

export default function Home(){
    return(
        <div className="bg-[#46708D] h-screen w-screen flex flex-col justify-center items-center">
            <header className=" flex flex-col">
                <Image src="/assets/frey-trade.png" alt="Frey Trade Logo" width={100} height={100} />
            </header>
        </div>
    )
}
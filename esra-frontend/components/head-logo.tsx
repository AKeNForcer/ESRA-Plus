import Link from "next/link"


export const HeadLogo = () => {

  return <Link href='/'>
    <h1 className="text-5xl font-semibold text-cyan-800 invisible show-logo:visible">
      ESRA+
    </h1>
  </Link>
}
import { Helmet } from "react-helmet"
import Navbar from "components/Navbar"

const Layout = ({ title, content, children }) => {
    return (
        <>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={content} />
            </Helmet>
            <Navbar />
            <div className="container m-5">
                {children}
            </div>
        </>
    )
}

export default Layout;
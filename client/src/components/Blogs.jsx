import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import Loader from "./Loader";
import "../styles/Blogs.css";

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      const blogsDb = collection(db, "blogs");

      try {
        const blogsResp = await getDocs(blogsDb);
        setBlogs(blogsResp.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error fetching blogs: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <div className="blogsContainer">
      {blogs.map((blog) => (
        <div key={blog.id} className="blogCard">
          <div className="imgBlogContainer">
            <img src={blog.image} alt="" />
          </div>
          <div className="blogContent">
            <h3>{blog.title}</h3>
            <p>{blog.description}</p>
            <span>{blog.author}</span> - <span>{blog.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Blogs;

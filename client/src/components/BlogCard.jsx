import React from "react";
import '../styles/BlogCard.css';

function BlogCard({ blogs, titulo }) {
  return (
    <>
      <h2 className="blogsTitle">{titulo}</h2>
      <div className="blogsList">
        {blogs.map(blog => (
          <div key={blog.id} className="blog-card-container">
            <div className="blogCardLeft">
              <img className="blogCardImg" src={blog.image} alt={blog.title} />
            </div>
            <div className="blogCardRight">
              <p className="blogCardDate">{blog.date}</p>
              <h3 className="blogCardTitle">{blog.title}</h3>
              <p className="blogCardDescription">{blog.description}</p>
              <h4>
                Por: <span className="blogCardAutor">{blog.author}</span>
              </h4>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default BlogCard;

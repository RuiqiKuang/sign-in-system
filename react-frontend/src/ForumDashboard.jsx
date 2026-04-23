import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import CommentSection from './CommentSection';
import './forum.css';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='%23dbe4f0'/><circle cx='32' cy='24' r='12' fill='%23859bb5'/><path d='M14 54c3-10 11-16 18-16s15 6 18 16' fill='%23859bb5'/></svg>";

const ForumDashboard = () => {
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsername(data.username);
          fetch(`http://localhost:3001/users/${data.username}/profile`, { credentials: 'include' })
            .then(res => res.json())
            .then(profileData => {
              if (profileData.success) {
                const url = profileData.profile.avatar
                  ? `${profileData.profile.avatar}?t=${Date.now()}`
                  : DEFAULT_AVATAR;
                setAvatarUrl(url);
              }
            });
        }
      });
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('http://localhost:3001/posts', { credentials: 'include' });
    const data = await res.json();
    if (data.success) setPosts(data.posts);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 9) {
      toast.error('最多只能上传 9 张图片');
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  const handleNewPost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) return;

    const formData = new FormData();
    formData.append('content', newPost);
    selectedImages.forEach(image => {
      formData.append('images', image);
    });

    await fetch('http://localhost:3001/posts', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    console.log(formData);
    setNewPost('');
    setSelectedImages([]);
    fetchPosts();
  };

  const handleLike = async (postId) => {
    const res = await fetch(`http://localhost:3001/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });

    const data = await res.json();
    if (data.success) {
      toast.success(data.action === 'liked' ? '❤️ You liked this post!' : '💔 You unliked this post.');
      fetchPosts();
    }
  };

  return (
    <div className="forum-container">
      <div className="dashboard-header">
        <div className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {avatarUrl && <img src={avatarUrl} alt="avatar" onError={() => setAvatarUrl(DEFAULT_AVATAR)} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />}
            <span className="greeting">Hi, {username}</span>
          </div>
          <Link to={`/profile/${username}`}><button className="profile-btn">My Profile</button></Link>
          <button className="logout-btn" onClick={() => window.location.href = '/'}>Logout</button>
        </div>

        <div className="new-post-card">
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share something new..." className="new-post-input" />
          <input type="file" accept="image/*" multiple onChange={handleImageSelect} />
          <div className="image-preview">
            {selectedImages.map((image, index) => <img key={index} src={URL.createObjectURL(image)} alt="Preview" style={{ width: '100px', marginRight: '10px' }} />)}
          </div>
          <button className="post-btn" onClick={handleNewPost}>Post</button>
        </div>
      </div>

      <div className="post-list">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header"><strong>{post.username}</strong> • {new Date(post.createdAt).toLocaleString()}</div>
            <div className="post-content">{post.content}
              {post.imageUrls?.length > 0 && post.imageUrls.map((url, index) => <img key={index} src={url} alt="PostImage" style={{ maxWidth: '100%' }} />)}
            </div>
            <div className="post-footer">
              <button className="like-btn" onClick={() => handleLike(post.id)}>❤️ {post.likes}</button>
            </div>
            {post.likers.length > 0 && <div className="post-likers">Liked by: {post.likers.join(', ')}</div>}
            <CommentSection postId={post.id} />
          </div>
        ))}
      </div>

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default ForumDashboard;

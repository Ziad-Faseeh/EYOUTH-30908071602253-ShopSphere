import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState(null);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [sortBy, setSortBy] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 10;

  const [isAdmin, setIsAdmin] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Stories');
  const [showAddModal, setShowAddModal] = useState(false);

  const pollRef = useRef(null);

  const API_BASE_URL = 'https://eyouth-30908071602253-shop-sphere.vercel.app';

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const getToken = () => localStorage.getItem('token') || null;
  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchProducts = () => {
    fetch(`${API_BASE_URL}/api/products`, {
      headers: {
        ...getAuthHeaders()
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Server returned status: ' + res.status);
        }
        return res.json();
      })
      .then(data => setBooks(data))
      .catch(err => {
        console.error(err);
        setError('Failed to load books: ' + err.message);
      });
  };

  const fetchReviews = () => {
    fetch(`${API_BASE_URL}/api/external-reviews`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setReviews(data.data);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        if (payload.isAdmin) setIsAdmin(true);
        if (payload.email) {
          const nameFromEmail = payload.email.split('@')[0];
          setUsername(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
        }
        setIsLoggedIn(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      fetchReviews();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchProducts, 10000);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [isLoggedIn]);

  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'login') {
      if (email === 'admin@deci.com' && password === '0000') {
        fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.token) {
              localStorage.setItem('token', data.token);
              const payload = parseJwt(data.token);
              if (payload && payload.isAdmin) setIsAdmin(true);
            }
            setUsername('Admin');
            setIsLoggedIn(true);
          })
          .catch(() => {
            setIsAdmin(true);
            setUsername('Admin');
            setIsLoggedIn(true);
          });
        return;
      }

      fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Invalid email or password');
          }
          return res.json();
        })
        .then(data => {
          const token = data && data.token;
          if (token) {
            localStorage.setItem('token', token);
            const payload = parseJwt(token);
            if (email === 'admin@deci.com' || (payload && payload.isAdmin)) {
              setIsAdmin(true);
              setUsername('Admin');
            } else {
              const nameFromEmail = email.split('@')[0];
              setUsername(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
            }
          } else {
            const nameFromEmail = email.split('@')[0];
            setUsername(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
          }
          setIsLoggedIn(true);
        })
        .catch(err => {
          setAuthError(err.message);
        });
    } else {
      if (username.trim() === '') {
        setAuthError('Please enter a username');
        return;
      }
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setEmail('');
    setPassword('');
    setCart([]);
    if (authMode === 'login') setUsername('');
    localStorage.removeItem('token');
  };

  const addToCart = (book) => {
    setCart([...cart, book]);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const confirmCheckout = () => {
    setCart([]);
    setShowCheckoutModal(false);
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    
    const newBookId = Date.now(); 
    const bookData = { 
      id: newBookId, 
      title: newTitle, 
      author: newAuthor, 
      price: parseFloat(newPrice), 
      category: newCategory 
    };
    
    setBooks([...books, bookData]);
    setShowAddModal(false);
    setNewTitle(''); 
    setNewAuthor(''); 
    setNewPrice('');

    fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        title: newTitle,
        author: newAuthor,
        price: parseFloat(newPrice),
        category: newCategory
      })
    })
    .then(res => {
      if (!res.ok) console.error('Server failed to save, but added locally');
      return res.json();
    })
    .catch(err => console.error('Network error, book kept locally:', err));
  };

  const handleDeleteBook = (id) => {
    fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } })
      .then(() => {
        setBooks(books.filter(book => book.id !== id));
      })
      .catch(err => {
        console.error('Delete failed:', err);
      });
  };

  const cartTotal = cart.reduce((total, book) => total + book.price, 0);

  const filtered = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filtered].sort((a, b) => {
    if (sortBy === 'low-to-high') return a.price - b.price;
    if (sortBy === 'high-to-low') return b.price - a.price;
    return 0;
  });

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = sortedBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Arial, sans-serif' }}>
        <form onSubmit={handleAuth} style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: '100%', maxWidth: '360px' }}>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          
          {authError && (
            <div style={{ color: 'red', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold', fontSize: '14px' }}>
              {authError}
            </div>
          )}

          {authMode === 'signup' && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="username-input" style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Username</label>
              <input 
                id="username-input"
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email-input" style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Email Address</label>
            <input 
              id="email-input"
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="password-input" style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Password</label>
            <input 
              id="password-input"
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" style={{ width: '100%', backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {authMode === 'login' ? 'Login' : 'Sign Up'}
          </button>

          <p style={{ textAlign: 'center', margin: 0, fontSize: '14px', color: '#555' }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(null); }}
              style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#333', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Z-BOOK Store</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontWeight: 'bold', color: '#555', fontSize: '15px' }}>Welcome, <span style={{ color: '#007bff' }}>{username}</span>!</span>
          <button onClick={handleLogout} style={{ backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </div>

      {isAdmin ? (
        <div style={{ width: '100%', maxWidth: '1000px', margin: '20px auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#333' }}>Admin Control Panel</h2>
            <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              New Book
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '15px', color: '#555' }}>Title</th>
                <th style={{ padding: '15px', color: '#555' }}>Author</th>
                <th style={{ padding: '15px', color: '#555' }}>Category</th>
                <th style={{ padding: '15px', color: '#555' }}>Price</th>
                <th style={{ padding: '15px', color: '#555' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#2c3e50' }}>{book.title}</td>
                  <td style={{ padding: '15px', color: '#7f8c8d' }}>{book.author}</td>
                  <td style={{ padding: '15px', color: '#007bff', fontWeight: 'bold', fontSize: '13px' }}>{book.category}</td>
                  <td style={{ padding: '15px', color: '#27ae60', fontWeight: 'bold' }}>${book.price}</td>
                  <td style={{ padding: '15px' }}>
                    <button onClick={() => handleDeleteBook(book.id)} style={{ backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {books.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>No books available. Click "New Book" to add one.</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '30px', alignItems: 'stretch' }}>
          
          <div style={{ flex: '1', maxWidth: 'calc(100% - 320px)' }}>
            {error && (
              <div style={{ color: 'red', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
              <input 
                type="text" 
                placeholder="Search by title or author..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ 
                  padding: '12px 20px', 
                  width: '100%', 
                  maxWidth: '500px', 
                  borderRadius: '25px', 
                  border: '1px solid #ccc', 
                  fontSize: '16px',
                  outline: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
              />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['All', 'Stories', 'Science', 'History', 'Tech'].map(category => (
                  <button 
                    key={category}
                    onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                    style={{
                      padding: '8px 24px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      backgroundColor: selectedCategory === category ? '#007bff' : '#fff',
                      color: selectedCategory === category ? '#fff' : '#555',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '15px' }}>
                <label htmlFor="sort-select" style={{ marginRight: '10px', fontWeight: 'bold', color: '#555' }}>Sort By Price: </label>
                <select 
                  id="sort-select"
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
                >
                  <option value="none">Default</option>
                  <option value="low-to-high">Low to High</option>
                  <option value="high-to-low">High to Low</option>
                </select>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '25px',
              width: '100%'
            }}>
              {currentBooks.map(book => {
                const bookReview = reviews.find(r => 
                String(r.productId || r.bookId || r.id) === String(book.id || book._id)
                );
                return (
                  <div key={book.id} style={{ 
                    backgroundColor: '#fff', 
                    padding: '20px', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <img 
                      src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60" 
                      alt="Book Cover" 
                      style={{ width: '120px', height: '170px', objectFit: 'cover', borderRadius: '6px', marginBottom: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <h3 style={{ margin: '10px 0 5px 0', color: '#2c3e50', fontSize: '16px', height: '40px', overflow: 'hidden' }}>{book.title}</h3>
                    <p style={{ margin: '5px 0', color: '#7f8c8d', fontSize: '13px' }}>{book.author}</p>
                    <p style={{ margin: '5px 0', color: '#007bff', fontSize: '12px', fontWeight: 'bold' }}>{book.category}</p>
                    <p style={{ margin: '12px 0', fontWeight: 'bold', color: '#27ae60', fontSize: '18px' }}>${book.price}</p>
                    
                    {bookReview && (
                      <div style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '6px', margin: '8px 0', width: '100%', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: '12px', color: '#f39c12', fontWeight: 'bold' }}>⭐ {bookReview.rating}/5</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555', fontStyle: 'italic' }}>"{bookReview.comment}"</p>
                      </div>
                    )}

                    <button 
                      onClick={() => addToCart(book)}
                      style={{ 
                        backgroundColor: '#007bff', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '8px 15px', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        width: '100%',
                        marginTop: 'auto'
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>

            {currentBooks.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '18px', marginTop: '40px' }}>No books found.</p>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: currentPage === 1 ? '#e0e0e0' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ fontWeight: 'bold', color: '#555' }}>Page {currentPage} of {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: currentPage === totalPages ? '#e0e0e0' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div style={{ 
            width: '290px', 
            backgroundColor: '#fff', 
            padding: '20px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
            position: 'sticky', 
            top: '30px',
            height: 'calc(100vh - 60px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #f4f7f6', paddingBottom: '10px', marginTop: 0, fontSize: '20px' }}>Cart ({cart.length})</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
              {cart.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>Your cart is empty.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {cart.map((item, index) => (
                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', backgroundColor: '#fafafa', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ flex: 1, marginRight: '10px' }}>
                        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '140px', display: 'block', fontWeight: 'bold', fontSize: '13px' }}>{item.title}</span>
                        <span style={{ color: '#27ae60', fontSize: '13px' }}>${item.price}</span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(index)}
                        style={{ backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ borderTop: '2px solid #f4f7f6', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>
                <span>Total:</span>
                <span style={{ color: '#27ae60' }}>${cartTotal}</span>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(true)}
                disabled={cart.length === 0}
                style={{ 
                  backgroundColor: cart.length === 0 ? '#bdc3c7' : '#27ae60', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold',
                  width: '100%',
                  fontSize: '15px'
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: '#27ae60', fontSize: '50px', marginBottom: '10px' }}>✓</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Order Placed Successfully!</h3>
            <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>
              Thank you for your purchase, <strong>{username}</strong>.<br />
              You bought <strong>{cart.length}</strong> books for a total of <strong>${cartTotal}</strong>.
            </p>
            <button 
              onClick={confirmCheckout}
              style={{ backgroundColor: '#27ae60', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={handleAddBook} style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Add New Book</h3>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="new-title" style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Title</label>
              <input id="new-title" type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="new-author" style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Author</label>
              <input id="new-author" type="text" required value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="new-price" style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Price ($)</label>
              <input id="new-price" type="number" step="0.01" required value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="new-category" style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>Category</label>
              <select id="new-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}>
                <option value="Stories">Stories</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Tech">Tech</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button type="submit" style={{ padding: '10px 20px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Book</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default App;

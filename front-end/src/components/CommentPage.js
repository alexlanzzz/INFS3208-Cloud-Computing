import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import info2Icon from '../assets/icons/info2.png';

const CommentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.destination;

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visitTime, setVisitTime] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [recommendTickets, setRecommendTickets] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  // NEW: policy modal state
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const showPolicyInfo = () => setIsPolicyOpen(true);
  const closePolicyInfo = () => setIsPolicyOpen(false);

  const visitTimeOptions = ['Weekday', 'Weekend', 'Public Holiday'];
  const waitTimeOptions = ['No wait', 'Up to 10 min', '10-30 min', '30-60 min', '1 hr+'];
  const ticketRecommendOptions = ['Yes', 'No', 'Not sure'];

  const handleStarClick = (starIndex) => setRating(starIndex);
  const handleStarHover = (starIndex) => setHoveredRating(starIndex);
  const handleStarLeave = () => setHoveredRating(0);

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedPhotos(prev => [
      ...prev,
      ...files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    ]);
  };

  const removePhoto = (photoId) => {
    setSelectedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    const review = {
      rating,
      text: reviewText,
      anonymous: isAnonymous,
      authorName: isAnonymous ? 'Anonymous' : 'Hendrick',
      visitTime,
      waitTime,
      recommendTickets,
      photos: selectedPhotos,
      destination: destination?.name,
      timestamp: new Date().toISOString(),
    };
    console.log('Submitting review:', review);
    alert(isAnonymous ? 'Your anonymous review has been posted!' : 'Your public review has been posted!');
    navigate(-1);
  };

  if (!destination) {
    return (
      <div className="comment-page">
        <div className="error-message">
          <p>No destination data found</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-page">
      <div className="header">
        <button className="close-btn" onClick={() => navigate(-1)} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h1>{destination.name}</h1>
      </div>

      <div className="content">
        <div className="user-section">
          <div className="user-avatar"></div>
          <div className="user-info">
            <span className="username">Hendrick</span>
            <div className="anonymous-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <span>{isAnonymous ? 'Posting anonymously' : 'Posting publicly'}</span>
            </div>
          </div>
          <button type="button" className="info-btn" onClick={showPolicyInfo} aria-label="See posting policy">
            <img src={info2Icon} alt="Info" width="20" height="20" />
          </button>
        </div>

        <div className="rating-section">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star ${star <= (hoveredRating || rating) ? 'filled' : ''}`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                aria-label={`${star} star`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="review-section">
          <textarea
            className="review-input"
            placeholder="Choose a rating first, then add a review."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            disabled={rating === 0}
          />
        </div>

        <div className="photo-section">
          <div className="photo-buttons">
            <label className="photo-btn">
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <div className="btn-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>Take a photo</span>
              </div>
            </label>

            <label className="photo-btn">
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <div className="btn-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
                <span>Upload a photo</span>
              </div>
            </label>
          </div>

          {selectedPhotos.length > 0 && (
            <div className="selected-photos">
              {selectedPhotos.map((photo) => (
                <div key={photo.id} className="photo-preview">
                  <img src={photo.url} alt="Selected" />
                  <button className="remove-photo" onClick={() => removePhoto(photo.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="question-section">
          <h3>When did you visit?</h3>
          <div className="option-buttons">
            {visitTimeOptions.map((option) => (
              <button
                key={option}
                className={`option-btn ${visitTime === option ? 'selected' : ''}`}
                onClick={() => setVisitTime(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="question-section">
          <h3>How long did you wait to enter?</h3>
          <div className="option-buttons">
            {waitTimeOptions.map((option) => (
              <button
                key={option}
                className={`option-btn ${waitTime === option ? 'selected' : ''}`}
                onClick={() => setWaitTime(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="question-section">
          <h3>Do you recommend buying tickets in advance?</h3>
          <div className="option-buttons">
            {ticketRecommendOptions.map((option) => (
              <button
                key={option}
                className={`option-btn ${recommendTickets === option ? 'selected' : ''}`}
                onClick={() => setRecommendTickets(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="submit-section">
        <button className="submit-btn" onClick={handleSubmit} disabled={rating === 0}>
          Post
        </button>
      </div>

      {/* Modal */}
      {isPolicyOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="policy-title">
          <div className="modal">
            <h3 id="policy-title">How your posts appear</h3>
            <p>Posts may appear publicly with your profile name, picture or link to your profile.</p>
            <p>Posts must follow CoTrip’s policies.</p>
            <h3>How your posts are used</h3>
            <p>
              Posts may appear on and be used across the CoTrip platform for searching and rating purposes. You can
              delete your post anytime.
            </p>
            <button className="linklike" onClick={() => alert('Open content policy page')}>
              See content policy
            </button>
            <button className="primary" onClick={closePolicyInfo}>OK</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .comment-page{
            min-height: 100vh;
            background-color: white;
            display: flex;
            flex-direction: column;
        }
        .header {
            display: flex;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #E0E0E0;
            position: relative;
        }
        .close-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            color: #666;
        }
        .header h1 {
            flex: 1;
            text-align: center;
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #000;
        }
        .content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        .user-section {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            padding: 16px;
            background: #F8F9FA;
            border-radius: 12px;
        }
        .user-avatar {
            width: 48px;
            height: 48px;
            background: #E0E0E0;
            border-radius: 50%;
            margin-right: 12px;
        }
        .user-info {
            flex: 1;
        }
        .username {
            display: block;
            font-size: 16px;
            font-weight: 600;
            color: #000;
            margin-bottom: 4px;
        }
        .anonymous-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 24px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: #4A90E2;
        }
        input:checked + .slider:before {
            transform: translateX(20px);
        }
        .anonymous-toggle span {
            font-size: 14px;
            color: #666;
        }
        .info-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            color: #666;
        }
        .rating-section {
            text-align: center;
            margin-bottom: 24px;
        }
        .stars {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        .star {
            background: none;
            border: none;
            cursor: pointer;
            color: #E0E0E0;
            transition: color 0.2s ease;
        }
        .star.filled, .star:hover {
            color: #FFD700;
        }
        .review-section {
            margin-bottom: 24px;
        }
        .review-input {
            width: 100%;
            min-height: 120px;
            padding: 16px;
            border: 1px solid #E0E0E0;
            border-radius: 12px;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            box-sizing: border-box;
        }
        .review-input:disabled {
            background-color: #F5F5F5;
            color: #999;
        }
        .review-input:focus {
            outline: none;
            border-color: #4A90E2;
        }
        .photo-section {
            margin-bottom: 24px;
        }
        .photo-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .photo-btn {
            cursor: pointer;
        }
        .btn-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background: #F5F5F5;
            border-radius: 12px;
            color: #666;
            transition: background-color 0.2s ease;
        }
        .btn-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background: #F5F5F5;
            border-radius: 12px;
            color: #666;
            transition: background-color 0.2s ease;
        }

        .btn-content:hover {
            background: #E9E9E9;
        }

        .btn-content svg {
            margin-bottom: 8px;
        }

        .btn-content span {
            font-size: 14px;
        }

        .selected-photos {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }

        .photo-preview {
            position: relative;
            width: 80px;
            height: 80px;
            border-radius: 8px;
            overflow: hidden;
        }

        .photo-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .remove-photo {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 20px;
            height: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .question-section {
            margin-bottom: 24px;
            padding: 16px;
            background: #F8F9FA;
            border-radius: 12px;
        }

        .question-section h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: #000;
        }

        .option-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .option-btn {
            padding: 8px 16px;
            background: white;
            border: 1px solid #E0E0E0;
            border-radius: 20px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .option-btn:hover {
            border-color: #4A90E2;
        }

        .option-btn.selected {
            background: #4A90E2;
            color: white;
            border-color: #4A90E2;
        }

        .submit-section {
            padding: 20px;
            border-top: 1px solid #E0E0E0;
        }

        .submit-btn {
            width: 100%;
            padding: 16px;
            background: #4A90E2;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s ease;
        }

        .submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .submit-btn:hover:not(:disabled) {
            opacity: 0.9;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; z-index: 1000;
        }
        .modal {
          width: 100%;
          max-width: 360px;
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: left;
        }
        .modal h3 { margin: 8px 0; font-size: 16px; }
        .modal p { margin: 6px 0 10px; color: #555; font-size: 14px; }
        .modal .primary {
          width: 100%; margin-top: 12px; padding: 12px 16px;
          background: #4A90E2; color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;
        }
        .modal .linklike {
          background: none; border: none; padding: 0; margin: 0 0 8px 0;
          color: #1a73e8; text-decoration: underline; cursor: pointer; font-size: 14px;
        }

        .error-message { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
        .error-message button { margin-top: 16px; padding: 12px 24px; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer; }

        @media (max-width: 480px) {
          .content { padding: 16px; }
          .photo-buttons { grid-template-columns: 1fr; }
          .option-buttons { justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default CommentPage;
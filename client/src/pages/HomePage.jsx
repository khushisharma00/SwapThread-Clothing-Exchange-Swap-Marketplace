import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ListingCard from '../components/ListingCard';
import SponsoredCard from '../components/SponsoredCard';
import { Avatar, ErrorAlert, Modal, SkeletonGrid } from '../components/ui';

const CATEGORIES = [
  { slug: 'tops', label: 'Tops & Tees', icon: '👚' },
  { slug: 'shirts', label: 'Shirts', icon: '👔' },
  { slug: 'jeans', label: 'Jeans', icon: '👖' },
  { slug: 'dresses', label: 'Dresses', icon: '👗' },
  { slug: 'jackets', label: 'Jackets & Coats', icon: '🧥' },
  { slug: 'ethnic', label: 'Ethnic Wear', icon: '🥻' },
  { slug: 'footwear', label: 'Footwear', icon: '👟' },
  { slug: 'accessories', label: 'Accessories', icon: '👜' },
];

const STEPS = [
  {
    n: '01',
    title: 'List clothes you don’t wear',
    text: 'Snap a few photos, pick brand, size, and condition. SwapThread calculates an estimated swap value so comparisons are transparent.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Discover fair matches nearby',
    text: 'Filter by city, category, or size. Our algorithm suggests fair trades based on equal value — no haggling or price tags.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Chat, exchange, and wear',
    text: 'Propose a swap, agree on details in private chat, and exchange locally or by post. Both confirm on delivery — 100% money-free.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
];

const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Ananya Sharma',
    city: 'South Delhi',
    avatarColor: '#2f6b4f',
    rating: 5,
    traded: 'Zara Linen Blazer ⇄ Fabindia Raw Silk Kurta',
    date: '2 days ago',
    quote:
      'Found the exact Fabindia kurta I had been eyeing for months! The swap value algorithm made the trade feel completely balanced to both of us. Met at Hauz Khas metro and swapped in 2 minutes. Circular fashion at its best!',
  },
  {
    id: 'rev-2',
    name: 'Rohan Mehta',
    city: 'Indiranagar, Bengaluru',
    avatarColor: '#3d619b',
    rating: 5,
    traded: 'Levis 511 Slim Jeans ⇄ Uniqlo Flannel Overshirt',
    date: '4 days ago',
    quote:
      'I had three unworn pairs of selvedge jeans collecting dust. Traded one for a pristine Uniqlo overshirt. Packaging and postal dispatch was smooth, and it felt amazing not spending a single rupee.',
  },
  {
    id: 'rev-3',
    name: 'Priya Kulkarni',
    city: 'Bandra West, Mumbai',
    avatarColor: '#963d61',
    rating: 5,
    traded: 'H&M Tiered Midi Dress ⇄ Mango Floral Wrap Top',
    date: '1 week ago',
    quote:
      'SwapThread completely cured my fast-fashion craving. Instead of buying trendy tops for weekend dinners, I swap pieces I have already photographed. Quality was exactly as pictured and freshly cleaned.',
  },
  {
    id: 'rev-4',
    name: 'Vikram Verma',
    city: 'Salt Lake, Kolkata',
    avatarColor: '#8a6428',
    rating: 5,
    traded: 'Woodland Boots ⇄ Puma Retro Track Jacket',
    date: '1 week ago',
    quote:
      'Transparent swap values remove all the awkward price haggling you get on traditional classifieds. The built-in chat made coordinating super easy. Both of us confirmed delivery seamlessly.',
  },
  {
    id: 'rev-5',
    name: 'Kavita Rao',
    city: 'Kothrud, Pune',
    avatarColor: '#2f7564',
    rating: 5,
    traded: 'Biba Anarkali Suit ⇄ Global Desi Maxi Dress',
    date: '2 weeks ago',
    quote:
      'Needed an ethnic outfit for a family event and refused to spend ₹4,000 on something I would wear just once. Swapped an outfit from last Diwali. Eco-friendly, smart, and ultra-satisfying!',
  },
  {
    id: 'rev-6',
    name: 'Aarav Gupta',
    city: 'DLF CyberCity, Gurugram',
    avatarColor: '#4f3d9b',
    rating: 5,
    traded: 'Superdry Bomber Jacket ⇄ M&S Knit Cardigan',
    date: '2 weeks ago',
    quote:
      'The condition tags (Like New, Good, Fair) are honest and people take real pride in sending freshly dry-cleaned clothes. Smooth experience from discovery to unboxing.',
  },
];

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'basics', label: 'How Swapping Works' },
  { id: 'values', label: 'Values & Cashless' },
  { id: 'safety', label: 'Quality & Delivery' },
];

const FAQS = [
  {
    id: 'faq-1',
    category: 'basics',
    q: 'How does a clothing swap actually work on SwapThread?',
    a: 'It’s simple: List any clean, wearable clothing or accessories you no longer wear with photos, size, and condition. Browse other members’ closets in your city or across India. When you spot an item you love, tap "Propose Swap" and select an item from your wardrobe to offer in return. Once the owner accepts, you coordinate via built-in private chat to exchange locally or ship via courier.',
  },
  {
    id: 'faq-2',
    category: 'values',
    q: 'Is SwapThread really 100% money-free?',
    a: 'Yes, completely! SwapThread is strictly a cashless exchange marketplace. You never buy, sell, or pay cash for garments. Swaps are direct 1-to-1 clothing trades. The only expense is standard courier postage if you choose to mail garments instead of meeting in person.',
  },
  {
    id: 'faq-3',
    category: 'values',
    q: 'How is the "Estimated Swap Value" calculated?',
    a: 'Our algorithm estimates a fair swap benchmark based on garment category, brand tier (from fast fashion to premium/designer), and condition ("Like New", "Gently Used", "Good", or "Fair"). This gives both swappers an objective reference point so trades feel balanced without haggling or bargaining.',
  },
  {
    id: 'faq-4',
    category: 'safety',
    q: 'What condition must clothes be in to be accepted?',
    a: 'All garments must be clean, freshly washed or dry-cleaned, and in wearable condition without undisclosed flaws. We promote honest condition tagging: "Like New" (barely worn), "Gently Used" (great shape), "Good" (minor wear), or "Fair" (visible wear). Clear photos of any minor flaws ensure smooth, happy trades.',
  },
  {
    id: 'faq-5',
    category: 'safety',
    q: 'How do postal shipping and local meetups work?',
    a: 'You choose what works best! For local swaps in the same city, swappers typically meet at a bustling public place like a metro station or café. For out-of-city swaps, both members ship via courier (e.g. India Post, Delhivery, Porter, or Blue Dart) and share parcel tracking details directly in the swap chat.',
  },
  {
    id: 'faq-6',
    category: 'safety',
    q: 'What if the garment doesn’t fit or isn’t as described?',
    a: 'We always recommend checking flat-lay measurements in chat before agreeing to a swap. If an item arrives significantly different from the photos or description, you can report it via the "Report" button for moderator review, or re-list it on SwapThread to swap with someone else.',
  },
  {
    id: 'faq-7',
    category: 'basics',
    q: 'Can I swap multiple items or propose counter-offers?',
    a: 'Yes! Once a swap request is initiated, both parties can discuss terms in private chat, suggest alternative pieces from each other’s closets, or agree on a trade that works for both.',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const notify = useToast();
  const { data, loading, error, reload } = useAsync(() => api.get('/listings', { limit: 8, sort: 'newest' }), []);

  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    name: user?.name || '',
    city: user?.city || '',
    rating: 5,
    traded: '',
    quote: '',
  });

  const [faqCategory, setFaqCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState('faq-1');

  const filteredFaqs = faqCategory === 'all' ? FAQS : FAQS.filter((f) => f.category === faqCategory);

  function handleSubmitReview(e) {
    if (e) e.preventDefault();
    if (!newReview.name.trim()) {
      notify('Please enter your name.', 'error');
      return;
    }
    if (!newReview.city.trim()) {
      notify('Please enter your city.', 'error');
      return;
    }
    if (!newReview.quote.trim()) {
      notify('Please write a short review.', 'error');
      return;
    }

    const reviewToAdd = {
      id: `rev-${Date.now()}`,
      name: newReview.name.trim(),
      city: newReview.city.trim(),
      avatarColor: user?.avatarColor || '#2f6b4f',
      rating: newReview.rating || 5,
      traded: newReview.traded.trim() || 'Pre-loved Garment Swap',
      date: 'Just now',
      quote: newReview.quote.trim(),
    };

    setReviews([reviewToAdd, ...reviews]);
    notify('Thank you for sharing your swap story!', 'success');
    setIsReviewModalOpen(false);
    setNewReview({
      name: user?.name || '',
      city: user?.city || '',
      rating: 5,
      traded: '',
      quote: '',
    });
  }

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="rw-hero">
        <div className="container">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-12 col-lg-6">
              <span className="rw-eyebrow mb-2">Clothing exchange · No money involved</span>
              <h1 className="rw-display">
                Give your clothes a second life. <em>Swap, don&apos;t shop.</em>
              </h1>
              <p className="rw-lead mb-4">
                SwapThread connects conscious fashion lovers to refresh wardrobes directly without buying new. Trade pre-loved pieces with people in your city.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link to="/listings" className="btn btn-success btn-lg justify-content-center">
                  Browse clothes
                </Link>
                <Link to={user ? '/dashboard/listings/new' : '/register'} className="btn btn-outline-dark btn-lg justify-content-center">
                  {user ? '+ List an item' : 'Join for free'}
                </Link>
              </div>

              <ul className="rw-hero-points mb-0">
                <li><span className="rw-hero-point-icon">✓</span> Fair-value estimates</li>
                <li><span className="rw-hero-point-icon">✓</span> Nearby city matching</li>
                <li><span className="rw-hero-point-icon">✓</span> Built-in negotiation chat</li>
              </ul>
            </div>

            <div className="col-12 col-lg-6">
              <div className="rw-hero-art" aria-hidden="true">
                <div className="rw-hero-tile t1">
                  <span>👗</span>
                  <small>Wrap dress<br />est. swap value ₹1,920</small>
                </div>
                <div className="rw-hero-swap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </div>
                <div className="rw-hero-tile t2">
                  <span>🧥</span>
                  <small>Denim jacket<br />est. swap value ₹1,870</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Shortcuts Grid */}
      <section className="container py-4 py-lg-5" aria-labelledby="cat-shortcuts">
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <h2 id="cat-shortcuts" className="h4 fw-bold mb-0">Browse by category</h2>
          <Link to="/listings" className="rw-link small">View all categories →</Link>
        </div>
        <div className="rw-cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/listings?category=${c.slug}`} className="rw-cat-pill">
              <span className="rw-cat-icon" aria-hidden="true">{c.icon}</span>
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-4 py-lg-5" aria-labelledby="how-title">
        <div className="text-center mb-4 pb-2">
          <span className="rw-eyebrow mb-2">Sustainable & Simple</span>
          <h2 id="how-title" className="rw-section-title mb-2">How SwapThread works</h2>
          <p className="rw-lead mx-auto">Three simple steps to swap your way into a refreshed, circular wardrobe.</p>
        </div>
        <div className="row g-4">
          {STEPS.map((s) => (
            <div className="col-12 col-md-4" key={s.n}>
              <div className="rw-step">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="rw-step-n">{s.n}</span>
                  <span className="text-success p-2 bg-success-subtle rounded-3">{s.icon}</span>
                </div>
                <h3 className="h5 fw-bold">{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fresh Listings */}
      <section className="container py-4 py-lg-5" aria-labelledby="fresh-title">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <span className="rw-eyebrow mb-1">Live from our community</span>
            <h2 id="fresh-title" className="rw-section-title mb-0">Freshly listed garments</h2>
          </div>
          <Link to="/listings" className="btn btn-outline-dark btn-sm">
            Explore all ({data?.total || 35}+) →
          </Link>
        </div>

        {loading && <SkeletonGrid count={8} />}
        <ErrorAlert error={error} onRetry={reload} />

        {!loading && (
          <div className="row g-3 g-md-4">
            {(data?.items || []).slice(0, 3).map((l) => (
              <div className="col-6 col-md-4 col-lg-3" key={l.id}>
                <ListingCard listing={l} />
              </div>
            ))}
            <div className="col-6 col-md-4 col-lg-3" key="sponsored-grid-ad">
              <SponsoredCard />
            </div>
            {(data?.items || []).slice(3).map((l) => (
              <div className="col-6 col-md-4 col-lg-3" key={l.id}>
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Community Reviews & Swapper Stories */}
      <section id="reviews" className="container py-4 py-lg-5" aria-labelledby="reviews-title">
        <div className="text-center mb-4 pb-2">
          <span className="rw-eyebrow mb-2">Verified Community Experiences</span>
          <h2 id="reviews-title" className="rw-section-title mb-2">Loved by circular fashion swappers</h2>
          <p className="rw-lead mx-auto">
            Real clothes, real trades, and zero rupees spent. Here’s how fashion lovers across India refresh their wardrobes.
          </p>
        </div>

        {/* Rating Summary Banner */}
        <div className="rw-reviews-summary mb-4">
          <div className="row g-3 align-items-center justify-content-between">
            <div className="col-12 col-md-4 text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
                <span className="display-6 fw-bold text-success">4.9</span>
                <div>
                  <div className="rw-review-stars fs-5">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <div className="small text-muted">Over 380+ ratings</div>
                </div>
              </div>
              <div className="small text-muted">Average swap satisfaction score</div>
            </div>

            <div className="col-12 col-md-5 d-flex justify-content-center justify-content-md-around gap-4 text-center py-2 py-md-0">
              <div>
                <strong className="d-block fs-5 text-success">100%</strong>
                <span className="small text-muted">Money-Free</span>
              </div>
              <div>
                <strong className="d-block fs-5 text-success">1,240+</strong>
                <span className="small text-muted">Swappers</span>
              </div>
              <div>
                <strong className="d-block fs-5 text-success">98.4%</strong>
                <span className="small text-muted">Accuracy</span>
              </div>
            </div>

            <div className="col-12 col-md-3 text-center text-md-end">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm fw-semibold"
                onClick={() => setIsReviewModalOpen(true)}
              >
                ✍️ Write a Review
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="rw-review-grid">
          {reviews.map((r) => (
            <div key={r.id} className="rw-review-card">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="rw-review-stars" aria-label={`${r.rating} stars`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ opacity: s <= r.rating ? 1 : 0.25 }}>★</span>
                  ))}
                </div>
                <span className="small text-muted">{r.date}</span>
              </div>

              {r.traded && (
                <div className="rw-review-traded mb-2">
                  <span>⇄</span>
                  <span>{r.traded}</span>
                </div>
              )}

              <p className="rw-review-quote">
                &ldquo;{r.quote}&rdquo;
              </p>

              <div className="rw-review-author">
                <Avatar user={{ name: r.name, avatarColor: r.avatarColor || '#2f6b4f' }} size={38} />
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate small">{r.name}</div>
                  <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                    📍 {r.city} · <span className="text-success fw-medium">✓ Verified Swap</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions (Q&A) */}
      <section id="faq" className="container py-4 py-lg-5" aria-labelledby="faq-title">
        <div className="text-center mb-4 pb-2">
          <span className="rw-eyebrow mb-2">Got questions? We&apos;ve got answers</span>
          <h2 id="faq-title" className="rw-section-title mb-2">Frequently Asked Questions</h2>
          <p className="rw-lead mx-auto">
            Everything you need to know about clothing swaps, fair values, shipping, and safe exchanges on SwapThread.
          </p>
        </div>

        {/* FAQ Category Pills */}
        <div className="rw-faq-pills" role="tablist" aria-label="FAQ categories">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`rw-faq-pill ${faqCategory === cat.id ? 'active' : ''}`}
              onClick={() => setFaqCategory(cat.id)}
              role="tab"
              aria-selected={faqCategory === cat.id}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="rw-faq-list" role="region" aria-label="FAQ accordion list">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div key={faq.id} className={`rw-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="rw-faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-ans-${faq.id}`}
                  id={`faq-btn-${faq.id}`}
                >
                  <span>{faq.q}</span>
                  <span className="rw-faq-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`faq-ans-${faq.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${faq.id}`}
                    className="rw-faq-answer"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-4 pt-2">
          <p className="text-muted small mb-3">
            Still have a question that isn&apos;t answered here?
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/listings" className="btn btn-outline-dark btn-sm">
              Browse community listings
            </Link>
            <Link to={user ? '/dashboard/listings/new' : '/register'} className="btn btn-success btn-sm">
              {user ? 'List a pre-loved item' : 'Create free account'}
            </Link>
          </div>
        </div>
      </section>

      {/* Sustainability Impact Banner */}
      <section className="container py-4 py-lg-5">
        <div className="rw-impact p-4 p-md-5">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg-8">
              <span className="badge bg-white text-dark mb-2 fw-semibold px-3 py-2">🌍 Circular Fashion Impact</span>
              <h2 className="display-6 fw-bold text-white mb-3">Why swapping beats shopping</h2>
              <p className="mb-0 text-white-50 rw-reading-width fs-6">
                Textile waste is one of the world&apos;s fastest growing landfill pollutants. The most sustainable garment is already in someone&apos;s closet. By swapping instead of buying new, you save water, reduce carbon emissions, and keep quality clothing in active rotation.
              </p>
            </div>
            <div className="col-12 col-lg-4 text-lg-end">
              <Link to={user ? '/dashboard/listings/new' : '/register'} className="btn btn-light btn-lg w-100 w-lg-auto fw-bold text-dark">
                {user ? '+ List a pre-loved piece' : 'Start swapping today'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Write a Review Modal */}
      {isReviewModalOpen && (
        <Modal
          title="Share Your Swapper Story"
          onClose={() => setIsReviewModalOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSubmitReview}
              >
                Submit Review
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmitReview}>
            <div className="mb-3">
              <label htmlFor="review-name" className="form-label small fw-semibold">
                Your Name <span className="text-danger">*</span>
              </label>
              <input
                id="review-name"
                type="text"
                className="form-control"
                placeholder="e.g. Maya Sharma"
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                required
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6">
                <label htmlFor="review-city" className="form-label small fw-semibold">
                  Your City / Neighborhood <span className="text-danger">*</span>
                </label>
                <input
                  id="review-city"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bandra, Mumbai"
                  value={newReview.city}
                  onChange={(e) => setNewReview({ ...newReview, city: e.target.value })}
                  required
                />
              </div>

              <div className="col-12 col-sm-6">
                <label htmlFor="review-rating" className="form-label small fw-semibold">
                  Rating <span className="text-danger">*</span>
                </label>
                <select
                  id="review-rating"
                  className="form-select"
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                >
                  <option value={5}>★★★★★ 5 Stars (Exceptional)</option>
                  <option value={4}>★★★★☆ 4 Stars (Great)</option>
                  <option value={3}>★★★☆☆ 3 Stars (Good)</option>
                  <option value={2}>★★☆☆☆ 2 Stars (Fair)</option>
                  <option value={1}>★☆☆☆☆ 1 Star (Poor)</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="review-traded" className="form-label small fw-semibold">
                Garments Swapped (Optional)
              </label>
              <input
                id="review-traded"
                type="text"
                className="form-control"
                placeholder="e.g. Zara Blazer ⇄ Fabindia Kurta"
                value={newReview.traded}
                onChange={(e) => setNewReview({ ...newReview, traded: e.target.value })}
              />
              <div className="form-text small">
                Mention what you exchanged to inspire other swappers.
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="review-quote" className="form-label small fw-semibold">
                Your Review & Experience <span className="text-danger">*</span>
              </label>
              <textarea
                id="review-quote"
                className="form-control"
                rows={3}
                placeholder="How was the trade? How did the estimated value feel? How did coordination go?"
                value={newReview.quote}
                onChange={(e) => setNewReview({ ...newReview, quote: e.target.value })}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

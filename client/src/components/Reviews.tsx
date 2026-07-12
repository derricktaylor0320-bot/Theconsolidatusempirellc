import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, BadgeCheck, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PublicReview, PublicReviewWithReviewer } from "@shared/schema";

function Stars({
  rating,
  size = "w-4 h-4",
  testId,
}: {
  rating: number;
  size?: string;
  testId?: string;
}) {
  return (
    <div className="flex items-center gap-0.5" data-testid={testId}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= rating ? "text-primary fill-primary" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

function reviewDate(value: PublicReview["createdAt"]) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Small circular reviewer photo; falls back to the reviewer's initial.
function ReviewerAvatar({
  review,
  size = "w-9 h-9",
  textSize = "text-sm",
}: {
  review: PublicReviewWithReviewer;
  size?: string;
  textSize?: string;
}) {
  if (review.reviewerAvatarUrl) {
    return (
      <img
        src={review.reviewerAvatarUrl}
        alt=""
        className={`${size} rounded-full object-cover border border-primary/40 shrink-0`}
        data-testid={`img-reviewer-avatar-${review.id}`}
      />
    );
  }
  return (
    <span
      className={`${size} rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-display font-bold ${textSize} shrink-0`}
    >
      {(review.reviewerName || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function ReviewCard({ review }: { review: PublicReviewWithReviewer }) {
  return (
    <div
      className="rounded-lg border border-primary/20 bg-background/40 p-5"
      data-testid={`card-review-${review.id}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        <ReviewerAvatar review={review} />
        <div className="flex flex-col">
          <span
            className="font-display font-semibold uppercase tracking-wide text-sm"
            data-testid={`text-reviewer-${review.id}`}
          >
            {review.reviewerName}
          </span>
          {review.reviewerLocation && (
            <span
              className="text-xs text-muted-foreground"
              data-testid={`text-reviewer-location-${review.id}`}
            >
              {review.reviewerLocation}
            </span>
          )}
        </div>
        <Stars rating={review.rating} testId={`stars-review-${review.id}`} />
        {review.verified && (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium text-primary border border-primary/40 rounded-full px-2 py-0.5"
            data-testid={`badge-verified-${review.id}`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            Verified Purchase
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto" data-testid={`text-review-date-${review.id}`}>
          {reviewDate(review.createdAt)}
        </span>
      </div>
      <p
        className="text-sm text-secondary-foreground/80 leading-relaxed whitespace-pre-line"
        data-testid={`text-review-comment-${review.id}`}
      >
        {review.comment}
      </p>
    </div>
  );
}

export function ReviewsSection({ productName }: { productName: string }) {
  const { isAuthenticated } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const queryKey = ["/api/reviews", productName] as const;
  const { data: reviews, isLoading } = useQuery<PublicReviewWithReviewer[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(
        `/api/reviews?product=${encodeURIComponent(productName)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
  });

  const average = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const submitReview = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reviews", {
        productName,
        rating,
        comment: comment.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      setFormOpen(false);
      setRating(0);
      setComment("");
      setFormError("");
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", productName] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/recent"] });
      setTimeout(() => setSubmitted(false), 4000);
    },
    onError: (err: any) => {
      const msg = String(err?.message || "Failed to submit review");
      // apiRequest errors look like "400: {json body}" — surface just the text.
      setFormError(msg.replace(/^\d+:\s*/, "").replace(/^\{.*"error"\s*:\s*"(.*?)".*\}$/, "$1"));
    },
  });

  const handleSubmit = () => {
    if (rating < 1) {
      setFormError("Please pick a star rating.");
      return;
    }
    if (comment.trim().length < 3) {
      setFormError("Please tell us a little about the product.");
      return;
    }
    setFormError("");
    submitReview.mutate();
  };

  return (
    <section className="max-w-3xl mx-auto mt-20" data-testid="section-reviews">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-primary">
            Customer Reviews
          </h2>
          {reviews && reviews.length > 0 ? (
            <div className="flex items-center gap-3 mt-2">
              <Stars rating={Math.round(average)} size="w-5 h-5" testId="stars-average" />
              <span className="text-sm text-muted-foreground" data-testid="text-review-summary">
                {average.toFixed(1)} out of 5 · {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-no-reviews">
              No reviews yet — be the first to share your experience.
            </p>
          )}
        </div>

        {isAuthenticated ? (
          <Button
            variant="outline"
            className="uppercase tracking-wider font-display"
            onClick={() => setFormOpen((v) => !v)}
            data-testid="button-write-review"
          >
            <PenLine className="w-4 h-4 mr-2" />
            {formOpen ? "Close" : "Write a Review"}
          </Button>
        ) : (
          <Link href="/auth">
            <Button
              variant="outline"
              className="uppercase tracking-wider font-display"
              data-testid="link-signin-to-review"
            >
              Sign in to Review
            </Button>
          </Link>
        )}
      </div>

      {submitted && (
        <p
          className="mb-6 text-sm text-primary border border-primary/40 rounded-lg px-4 py-3 bg-primary/5"
          data-testid="text-review-thanks"
        >
          Thank you! Your review has been posted.
        </p>
      )}

      {formOpen && isAuthenticated && (
        <div
          className="rounded-lg border border-primary/30 bg-background/40 p-5 mb-8"
          data-testid="form-review"
        >
          <p className="text-sm font-medium mb-2">Your rating</p>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                data-testid={`button-star-${n}`}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    n <= (hovered || rating)
                      ? "text-primary fill-primary"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm font-medium mb-2">Your review</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="How's the quality? How did it look when it arrived?"
            data-testid="input-review-comment"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Reviews from customers whose order we have on file get a "Verified
            Purchase" badge automatically. Submitting again updates your
            earlier review of this product.
          </p>
          {formError && (
            <p className="text-sm text-destructive mt-3" data-testid="text-review-error">
              {formError}
            </p>
          )}
          <Button
            className="mt-4 bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
            onClick={handleSubmit}
            disabled={submitReview.isPending}
            data-testid="button-submit-review"
          >
            {submitReview.isPending ? "Posting..." : "Post Review"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground" data-testid="text-reviews-loading">
          Loading reviews...
        </p>
      ) : (
        <div className="space-y-4">
          {(reviews || []).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

// Homepage panel: latest reviews across every product. Renders nothing until
// the store has at least one review.
export function RecentReviewsPanel() {
  const { data: reviews } = useQuery<PublicReviewWithReviewer[]>({
    queryKey: ["/api/reviews/recent"],
  });

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-24 bg-muted/30" data-testid="section-recent-reviews">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight text-primary">
            What Customers Are Saying
          </h2>
          <p className="text-secondary-foreground/80 mt-4 max-w-2xl mx-auto">
            Real reviews from real orders — straight from the Khemistri family.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-primary/20 bg-background/40 p-6 flex flex-col"
              data-testid={`card-home-review-${review.id}`}
            >
              <Stars rating={review.rating} />
              <p className="text-sm text-secondary-foreground/80 leading-relaxed mt-3 flex-grow">
                {review.comment.length > 220
                  ? `${review.comment.slice(0, 220)}…`
                  : review.comment}
              </p>
              <div className="mt-4 pt-4 border-t border-primary/15">
                <div className="flex items-center gap-3">
                  <ReviewerAvatar review={review} size="w-10 h-10" textSize="text-base" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold uppercase tracking-wide text-sm">
                        {review.reviewerName}
                      </span>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {review.reviewerLocation ? `${review.reviewerLocation} · ` : ""}
                      on {review.productName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

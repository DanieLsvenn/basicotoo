"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";
import { apiFetch, API_ENDPOINTS } from "@/lib/api-utils";

interface Feedback {
  feedbackId: string;
  bookingId: string;
  customerId: string;
  feedbackDay: string;
  feedbackContent: string;
  rating: number;
}

const ViewFeedbacksPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(API_ENDPOINTS.FEEDBACK.ALL);
        if (!response.data) throw new Error(response.error || "Failed to fetch feedbacks");
        setFeedbacks(response.data);
      } catch (error) {
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Feedback</h1>
      </div>
      <Card>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No feedbacks found.
            </div>
          ) : (
            <div className="space-y-6">
              {feedbacks.map((fb) => (
                <div key={fb.feedbackId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Booking ID:</span>
                      <span className="text-sm text-muted-foreground">
                        {fb.bookingId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(fb.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-yellow-500 fill-yellow-400"
                        />
                      ))}
                      {[...Array(5 - fb.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gray-300" />
                      ))}
                    </div>
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Customer ID:</span>{" "}
                    <span className="text-sm text-muted-foreground">
                      {fb.customerId}
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Date:</span>{" "}
                    <span className="text-sm">{fb.feedbackDay}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Feedback:</span>
                    <div className="mt-1 text-gray-800">
                      {fb.feedbackContent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewFeedbacksPage;

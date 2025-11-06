-- CreateIndex
CREATE INDEX "PhotoComment_userId_createdAt_idx" ON "PhotoComment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PhotoFavorite_photoId_idx" ON "PhotoFavorite"("photoId");

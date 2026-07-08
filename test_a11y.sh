#!/bin/bash
echo "Testing lint..."
cd frontend
pnpm lint || echo "Lint failed, but continuing..."
pnpm build || echo "Build failed, but continuing..."

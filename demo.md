# Demo Instructions

## Quick Demo (Without API Key)

1. **Start the application**:
   ```bash
   npm install
   npm run dev
   ```

2. **Test Resume Upload**:
   - Go to the Interviewee tab
   - Click "Upload Resume" 
   - You can use any PDF or DOCX file, or the app will work with demo data

3. **Complete Profile** (if needed):
   - Fill in any missing information
   - Click "Start Interview"

4. **Take the Interview**:
   - Answer 6 questions with timers
   - Questions are automatically generated (demo mode)
   - Get scored and feedback for each answer

5. **View Results**:
   - Switch to Interviewer tab
   - See candidate list with scores
   - Click on any candidate for detailed view

## Demo with AI (With API Key)

1. **Get Gemini API Key**:
   - Visit https://makersuite.google.com/app/apikey
   - Create a free API key

2. **Configure Environment**:
   ```bash
   cp env.example .env
   # Edit .env and add your API key
   ```

3. **Restart the app**:
   ```bash
   npm run dev
   ```

4. **Experience AI Features**:
   - AI-generated questions
   - Intelligent answer scoring
   - Detailed AI summaries

## Features to Demo

### Interviewee Experience
- ✅ Resume upload with drag & drop
- ✅ Automatic data extraction
- ✅ Profile completion form
- ✅ Real-time interview with timers
- ✅ AI scoring and feedback
- ✅ Progress tracking

### Interviewer Dashboard
- ✅ Candidate list with scores
- ✅ Search and sort functionality
- ✅ Detailed candidate profiles
- ✅ Question-by-question analysis
- ✅ AI-generated summaries
- ✅ Statistics and analytics

### Technical Features
- ✅ Data persistence (refresh to test)
- ✅ Welcome back modal
- ✅ Responsive design
- ✅ Error handling
- ✅ Fallback systems

## Test Scenarios

1. **Complete Interview Flow**:
   - Upload resume → Complete profile → Take interview → View results

2. **Pause and Resume**:
   - Start interview → Close browser → Reopen → See welcome back modal

3. **Multiple Candidates**:
   - Complete multiple interviews → Switch to interviewer tab → Compare candidates

4. **Error Handling**:
   - Try uploading invalid files
   - Test with poor network connection
   - Test without API key (fallback mode)

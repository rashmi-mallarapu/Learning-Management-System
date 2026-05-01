import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkSpecificCourse() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms');
        const LessonSchema = new mongoose.Schema({}, { strict: false });
        const Lesson = mongoose.model('Lesson', LessonSchema);
        
        const courseId = '69f3b4df9945a80c8f1a7b2b';
        const lessons = await Lesson.find({ courseId: new mongoose.Types.ObjectId(courseId) }).lean();
        
        console.log(`Lessons for course ${courseId}:`, lessons.length);
        
        const CourseSchema = new mongoose.Schema({}, { strict: false });
        const Course = mongoose.model('Course', CourseSchema);
        const course = await Course.findById(courseId);
        console.log('Course exists:', !!course);
        if (course) console.log('Course title:', course.title);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkSpecificCourse();

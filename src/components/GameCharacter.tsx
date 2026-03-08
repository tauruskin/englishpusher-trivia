import teacherThinking from "@/assets/teacher-thinking.png";
import teacherCorrect from "@/assets/teacher-correct.png";
import teacherCelebrate from "@/assets/teacher-celebrate.png";
import teacherSad from "@/assets/teacher-sad.png";

export type CharacterPose = "idle" | "happy" | "sad" | "celebrate" | "thinking";

interface GameCharacterProps {
  pose: CharacterPose;
  className?: string;
}

const poseMap: Record<CharacterPose, { src: string; animClass: string }> = {
  idle: { src: teacherThinking, animClass: "animate-character-idle" },
  thinking: { src: teacherThinking, animClass: "animate-character-think" },
  happy: { src: teacherCorrect, animClass: "animate-character-jump" },
  sad: { src: teacherSad, animClass: "animate-shake" },
  celebrate: { src: teacherCelebrate, animClass: "animate-character-celebrate" },
};

const GameCharacter = ({ pose, className = "" }: GameCharacterProps) => {
  const { src, animClass } = poseMap[pose];

  return (
    <div className={`hidden md:flex items-center justify-center ${className} ${animClass}`}>
      <img src={src} alt="Teacher character" width={120} height={180} className="object-contain" />
    </div>
  );
};

export default GameCharacter;

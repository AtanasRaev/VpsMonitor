import ProjectCard from './ProjectCard';

export default function ProjectSection() {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Project Disk Usage
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ProjectCard
          target="myteam"
          label="MyTeam"
          path="/var/www/MyTeam"
        />
        <ProjectCard
          target="checkin_app"
          label="CheckIn App"
          path="/var/www/checkin/CheckIn"
        />
        <ProjectCard
          target="checkin_media"
          label="CheckIn Media"
          path="/var/www/checkin/media"
        />
      </div>
    </section>
  );
}

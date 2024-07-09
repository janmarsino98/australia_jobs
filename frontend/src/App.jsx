import JobCard from "./components/molecules/JobCard";
import Navbar from "./components/molecules/Navbar";
function App() {
  return (
    <>
      <div className="w-full border border-red-400 font-seriff bg-main-bg h-screen">
        <div>
          <Navbar
            navbar_options={[
              { text: "Find job", link: "/findjob", isActive: true },
              { text: "Publish job", link: "/publishjob" },
              { text: "Get CV Review", link: "/cvreview" },
            ]}
          ></Navbar>
        </div>
        <div>
          <JobCard
            title="engineer"
            city="Lleida"
            state="Spain  "
            remote="Hybrid"
            description="As a Sr DevOps Engineer, you will Oversee and manage the DevOps practices and processes within the organization..."
            skills={[{ name: "AWS" }, { name: "Python" }]}
            logo={
              "https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg"
            }
          ></JobCard>
          <JobCard
            title="engineer"
            subtitle="main engineer"
            isnew={true}
            remote="Hybrid"
            location="Lleida"
            salary="800"
          ></JobCard>
        </div>
      </div>
    </>
  );
}

export default App;

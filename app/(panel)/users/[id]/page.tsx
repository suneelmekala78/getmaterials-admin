"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { UserAvatar } from "@/components/UserAvatar";
import { UserCampusEditor } from "@/components/UserCampusEditor";

type TabId =
  | "profile"
  | "materials"
  | "reviews"
  | "reports"
  | "social"
  | "quizzes"
  | "polls"
  | "practice"
  | "more";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function when(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const record = value as { name?: string; title?: string; email?: string; code?: string };
    return [record.name, record.code].filter(Boolean).join(" · ") || record.title || record.email || "";
  }
  return "";
}

function titleOf(value: unknown, fallback = "Untitled") {
  return textValue(value) || fallback;
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}

function Fields({ rows }: { rows: { label: string; value?: unknown }[] }) {
  const filled = rows
    .map((row) => ({ label: row.label, value: textValue(row.value) }))
    .filter((row) => row.value);
  if (!filled.length) return <Empty text="Nothing recorded." />;
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {filled.map((row) => (
        <div key={row.label}>
          <dt className="text-xs font-medium text-slate-400">{row.label}</dt>
          <dd className="mt-0.5 text-sm text-slate-800 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ItemList({
  items,
  empty,
  render,
}: {
  items: any[];
  empty: string;
  render: (item: any, index: number) => ReactNode;
}) {
  if (!items?.length) return <Empty text={empty} />;
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, index) => render(item, index))}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
  const editCampus = searchParams.get("edit") === "campus";
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("profile");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Could not load this user");
        setData(body);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this user"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link href="/users" className="inline-flex items-center gap-2 text-sm font-medium text-violet-700">
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to users
        </Link>
        <p className="text-sm text-slate-500">{error || "User not found."}</p>
      </div>
    );
  }

  const user = data.user;
  const counts = data.counts || {};
  const study = user.studyProfile || {};
  const career = user.careerProfile || {};
  const social = user.social || {};
  const signup = user.signupMeta || {};

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "profile", label: "Profile" },
    { id: "materials", label: "Materials", count: counts.materials },
    { id: "reviews", label: "Reviews", count: (counts.reviews || 0) + (counts.feedback || 0) },
    { id: "reports", label: "Reports", count: counts.reports },
    { id: "social", label: "Social", count: (counts.followers || 0) + (counts.following || 0) },
    { id: "quizzes", label: "Quizzes", count: counts.quizAttempts },
    { id: "polls", label: "Polls", count: counts.pollResponses },
    { id: "practice", label: "Practice", count: counts.submissions },
    { id: "more", label: "More" },
  ];

  const stats = [
    ["Materials", counts.materials],
    ["Reviews", counts.reviews],
    ["Followers", counts.followers],
    ["Following", counts.following],
    ["Quiz attempts", counts.quizAttempts],
    ["Poll votes", counts.pollResponses],
    ["Practice runs", counts.submissions],
    ["Reports", counts.reports],
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/users" className="inline-flex items-center gap-2 text-sm font-medium text-violet-700">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar name={user.name} image={user.avatar} role={user.role} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              {user.isOwner ? (
                <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">Owner</span>
              ) : null}
              <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold capitalize text-violet-700">
                {String(user.role || "student").replace("_", " ")}
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                {user.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">Joined {when(user.createdAt)}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {stats.map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{value || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${
              tab === item.id ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {item.label}
            {item.count ? <span className="ml-1.5 opacity-80">{item.count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <UserCampusEditor
              userId={String(user._id)}
              study={study}
              accountCollege={user.college}
              defaultOpen={editCampus}
              onSaved={(payload) => setData(payload)}
            />
          </div>
          <Panel title="Account">
            <Fields
              rows={[
                { label: "Phone", value: user.phone },
                { label: "Email verified", value: user.emailVerified ? when(user.emailVerified) : "" },
                { label: "College", value: user.college },
                { label: "Assigned colleges", value: user.assignedColleges },
                { label: "Bio", value: user.bio },
                { label: "Qualifications", value: user.qualifications },
                { label: "Skills", value: user.skills },
                { label: "Interests", value: user.interests },
                { label: "Google sign-in", value: user.googleId ? "Connected" : "" },
                { label: "Apple sign-in", value: user.appleId ? "Connected" : "" },
                { label: "Slug", value: user.slug },
              ]}
            />
          </Panel>
          <Panel title="Links">
            <Fields
              rows={[
                { label: "Website", value: social.website },
                { label: "LinkedIn", value: social.linkedin },
                { label: "GitHub", value: social.github },
                { label: "Instagram", value: social.instagram },
                { label: "YouTube", value: social.youtube },
                { label: "X", value: social.twitter },
              ]}
            />
          </Panel>
          <Panel title="Campus profile">
            <Fields
              rows={[
                { label: "Completed", value: study.completed },
                { label: "College", value: study.college || study.collegeOther },
                { label: "Program", value: study.program || study.programOther },
                { label: "Branch", value: study.branch || study.branchOther },
                { label: "Year", value: study.year || study.yearOther },
                { label: "Semester", value: study.semester || study.semesterOther },
                { label: "Section", value: study.section || study.sectionOther },
                { label: "Subjects", value: study.subjects },
                { label: "Other subjects", value: study.subjectOthers },
              ]}
            />
          </Panel>
          <Panel title="Career profile">
            <Fields
              rows={[
                { label: "Type", value: career.applicantType },
                { label: "Program", value: career.program },
                { label: "Education", value: career.education },
                { label: "Studying year", value: career.studyingYear },
                { label: "Graduation year", value: career.graduationYear },
                { label: "Availability", value: career.availability },
                { label: "Location", value: career.location },
              ]}
            />
          </Panel>
          <Panel title="Signup">
            <Fields
              rows={[
                { label: "Platform", value: signup.platform },
                { label: "Device", value: signup.device },
                { label: "Location", value: [signup.city, signup.region, signup.country].filter(Boolean).join(", ") },
                { label: "IP", value: signup.ip },
                { label: "User agent", value: signup.userAgent },
              ]}
            />
          </Panel>
          <Panel title="Devices" hint={`${user.pushDeviceCount || 0} push device${user.pushDeviceCount === 1 ? "" : "s"}`}>
            <ItemList
              items={[...(user.pushDevices || []), ...(user.recognizedDevices || [])]}
              empty="No devices recorded."
              render={(device, index) => (
                <div key={`${device.deviceId || device.deviceName || "device"}-${index}`} className="py-2">
                  <p className="text-sm font-medium text-slate-800">
                    {device.deviceName || device.platform || "Device"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[device.platform, device.lastSeenAt ? `Last seen ${when(device.lastSeenAt)}` : "", device.createdAt ? `Added ${when(device.createdAt)}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}
            />
          </Panel>
          {user.deletionRequestedAt || user.deletionCancellations?.length ? (
            <Panel title="Account deletion">
              <Fields
                rows={[
                  { label: "Requested", value: user.deletionRequestedAt ? when(user.deletionRequestedAt) : "" },
                  { label: "Reason", value: user.deletionReason },
                  { label: "Past cancellations", value: user.deletionCancellations?.length },
                ]}
              />
            </Panel>
          ) : null}
        </div>
      )}

      {tab === "materials" && (
        <div className="grid gap-4">
          <Panel title="Uploaded" hint={counts.materials > (data.materials || []).length ? `Showing ${(data.materials || []).length} of ${counts.materials}` : undefined}>
            <ItemList
              items={data.materials || []}
              empty="This user has not uploaded materials."
              render={(item) => (
                <div key={item._id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <Link href={`/materials/${item._id}/edit`} className="text-sm font-medium text-slate-900 hover:text-violet-700">
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {[item.type, item.status, textValue(item.subject), `${item.views || 0} views`, `${item.downloads || 0} downloads`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-400">{when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Bookmarks" hint={`${counts.bookmarks || 0} saved`}>
              <ItemList
                items={user.bookmarks || []}
                empty="No bookmarks."
                render={(item) => (
                  <p key={item._id} className="py-2 text-sm text-slate-700">{item.title}</p>
                )}
              />
            </Panel>
            <Panel title="Recently viewed">
              <ItemList
                items={user.viewHistory || []}
                empty="No views recorded."
                render={(item, index) => (
                  <div key={`${item.material?._id || index}`} className="py-2">
                    <p className="text-sm text-slate-700">{titleOf(item.material)}</p>
                    <p className="text-xs text-slate-400">{when(item.at)}</p>
                  </div>
                )}
              />
            </Panel>
            <Panel title="Downloads">
              <ItemList
                items={user.downloadHistory || []}
                empty="No downloads recorded."
                render={(item, index) => (
                  <div key={`${item.material?._id || index}-dl`} className="py-2">
                    <p className="text-sm text-slate-700">{titleOf(item.material)}</p>
                    <p className="text-xs text-slate-400">{when(item.at)}</p>
                  </div>
                )}
              />
            </Panel>
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Written reviews" hint={`${counts.reviews || 0} total`}>
            <ItemList
              items={data.reviews || []}
              empty="No reviews."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{titleOf(item.material)}</p>
                    <p className="text-xs font-semibold text-amber-600">{item.rating}/5</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.comment}</p>
                  <p className="mt-1 text-xs text-slate-400">{when(item.createdAt)} · {item.isApproved ? "Visible" : "Hidden"}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Material ratings" hint={`${counts.feedback || 0} total`}>
            <ItemList
              items={data.feedback || []}
              empty="No ratings."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{titleOf(item.material)}</p>
                    <p className="text-xs font-semibold text-amber-600">{item.rating}/5</p>
                  </div>
                  {item.comment ? <p className="mt-1 text-sm text-slate-600">{item.comment}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">{when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
        </div>
      )}

      {tab === "reports" && (
        <div className="grid gap-4">
          <Panel title="Bug reports" hint="Matched by this user's email">
            <ItemList
              items={data.reports?.bugs || []}
              empty="No bug reports."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{item.subject || item.bugType || "Bug report"}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{[item.platform, when(item.createdAt)].filter(Boolean).join(" · ")}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Contact messages">
            <ItemList
              items={data.reports?.contacts || []}
              empty="No contact messages."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{item.subject || "Message"}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.status} · {when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Quiz answer-key flags">
            <ItemList
              items={data.reports?.quizFlags || []}
              empty="No flagged quiz keys."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{titleOf(item.quiz)}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.feedbackNote || "Flagged the answer key."}</p>
                  <p className="mt-1 text-xs text-slate-400">Score {item.score} · {when(item.completedAt)}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Site feedback">
            <ItemList
              items={data.reports?.feedback || []}
              empty="No site feedback."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{item.subject || "Feedback"} {item.rating ? `· ${item.rating}/5` : ""}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
        </div>
      )}

      {tab === "social" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Followers" hint={`${counts.followers || 0} people follow this user`}>
            <ItemList
              items={data.followers || []}
              empty="No followers."
              render={(item) => (
                <div key={item._id} className="flex items-center justify-between gap-3 py-3">
                  <PersonLink person={item.follower} />
                  <p className="text-xs text-slate-400">{when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Following" hint={`Following ${counts.following || 0} people`}>
            <ItemList
              items={data.following || []}
              empty="Not following anyone."
              render={(item) => (
                <div key={item._id} className="flex items-center justify-between gap-3 py-3">
                  <PersonLink person={item.following} />
                  <p className="text-xs text-slate-400">{when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
        </div>
      )}

      {tab === "quizzes" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Attempts" hint={`${counts.quizAttempts || 0} total`}>
            <ItemList
              items={data.quizAttempts || []}
              empty="No quiz attempts."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{titleOf(item.quiz)}</p>
                    <p className="text-sm font-semibold text-slate-700">{item.score}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {[
                      item.timeSpentSeconds != null ? `${item.timeSpentSeconds}s` : "",
                      item.rating ? `Rated ${item.rating}/5` : "",
                      item.flagWrongKey ? "Flagged answer key" : "",
                      when(item.completedAt),
                    ].filter(Boolean).join(" · ")}
                  </p>
                  {item.feedbackNote ? <p className="mt-1 text-sm text-slate-600">{item.feedbackNote}</p> : null}
                </div>
              )}
            />
          </Panel>
          <Panel title="Quizzes created" hint={`${counts.createdQuizzes || 0} total`}>
            <ItemList
              items={data.createdQuizzes || []}
              empty="This user has not created quizzes."
              render={(item) => (
                <div key={item._id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.isActive ? "Active" : "Inactive"} · {item.attempts || 0} attempts</p>
                  </div>
                  <p className="text-xs text-slate-400">{when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
        </div>
      )}

      {tab === "polls" && (
        <Panel title="Poll responses" hint={`${counts.pollResponses || 0} votes`}>
          <ItemList
            items={data.pollResponses || []}
            empty="No poll responses."
            render={(item) => (
              <div key={`${item.pollId}-${item.createdAt}`} className="py-3">
                <p className="text-sm font-medium text-slate-900">{item.question}</p>
                <p className="mt-1 text-sm text-slate-600">Answer: {item.answer}</p>
                <p className="mt-1 text-xs text-slate-400">{item.type} · {when(item.createdAt)}</p>
              </div>
            )}
          />
        </Panel>
      )}

      {tab === "practice" && (
        <div className="grid gap-4">
          <Panel title="Stats">
            <Fields
              rows={[
                { label: "Solved", value: data.practice?.stats?.solvedCount },
                { label: "Current streak", value: data.practice?.stats?.currentStreak },
                { label: "Longest streak", value: data.practice?.stats?.longestStreak },
                { label: "Last solved", value: data.practice?.stats?.lastSolvedDate },
              ]}
            />
          </Panel>
          <Panel title="Submissions" hint={`${counts.submissions || 0} total`}>
            <ItemList
              items={data.practice?.submissions || []}
              empty="No practice submissions."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{titleOf(item.problem)}</p>
                    <p className="text-xs font-semibold text-slate-700">{item.verdict}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {[item.language, `${item.passed || 0}/${item.total || 0} tests`, item.runtimeMs ? `${item.runtimeMs} ms` : "", titleOf(item.contest, ""), when(item.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Discussions" hint={`${counts.discussions || 0} posts`}>
            <ItemList
              items={data.practice?.discussions || []}
              empty="No practice discussions."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{titleOf(item.problem)}</p>
                  <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{item.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
        </div>
      )}

      {tab === "more" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Campus suggestions">
            <ItemList
              items={data.catalogRequests || []}
              empty="No campus suggestions."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900 capitalize">{item.kind}: {item.name}</p>
                  <p className="text-xs text-slate-500">{item.status} · {when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Material requests">
            <ItemList
              items={data.materialRequests || []}
              empty="No material requests."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{titleOf(item.subject, "Request")}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.status} · {when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Role requests">
            <ItemList
              items={data.roleRequests || []}
              empty="No role requests."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{item.fromRole} → {item.toRole}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.status} · {when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Job applications">
            <ItemList
              items={data.jobApplications || []}
              empty="No job applications."
              render={(item) => (
                <div key={item._id} className="py-3">
                  <p className="text-sm font-medium text-slate-900">{titleOf(item.job)}</p>
                  <p className="text-xs text-slate-500">{item.status} · {when(item.createdAt)}</p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Referral">
            {data.referral ? (
              <Fields
                rows={[
                  { label: "Source", value: data.referral.source },
                  { label: "Medium", value: data.referral.medium },
                  { label: "Campaign", value: data.referral.campaign },
                  { label: "Code", value: data.referral.referralCode },
                  { label: "Landing page", value: data.referral.landingPage },
                  { label: "Platform", value: data.referral.platform },
                ]}
              />
            ) : (
              <Empty text="No referral record." />
            )}
          </Panel>
          <Panel title="Timetable">
            <ItemList
              items={data.timetable || []}
              empty="No timetable slots."
              render={(item) => (
                <div key={item._id} className="py-2">
                  <p className="text-sm font-medium text-slate-800">{item.subjectName}</p>
                  <p className="text-xs text-slate-500">
                    {DAYS[item.day] || `Day ${item.day}`} · {item.startTime}–{item.endTime}
                    {item.room ? ` · ${item.room}` : ""}
                  </p>
                </div>
              )}
            />
          </Panel>
        </div>
      )}
    </div>
  );
}

function PersonLink({ person }: { person?: any }) {
  if (!person) return <p className="text-sm text-slate-400">Unknown user</p>;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar name={person.name} image={person.avatar} role={person.role} size={32} />
      <div className="min-w-0">
        {person._id ? (
          <Link href={`/users/${person._id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-violet-700">
            {person.name || "User"}
          </Link>
        ) : (
          <p className="truncate text-sm font-medium text-slate-900">{person.name || "User"}</p>
        )}
        <p className="truncate text-xs text-slate-500">{person.email}</p>
      </div>
    </div>
  );
}

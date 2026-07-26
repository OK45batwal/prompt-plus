import { Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
          <p className="text-muted-foreground mt-2">Have a question or feedback? We'd love to hear from you.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <a
            href="mailto:okbatwal@gmail.com"
            className="p-6 rounded-xl border hover:border-foreground/20 transition-colors flex flex-col items-center text-center"
          >
            <Mail className="h-5 w-5 mb-3" />
            <h3 className="font-medium text-sm">Email</h3>
            <p className="text-sm text-muted-foreground mt-1">okbatwal@gmail.com</p>
          </a>
          <a
            href="https://github.com/okbatwal/prompt-plus/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-xl border hover:border-foreground/20 transition-colors flex flex-col items-center text-center"
          >
            <MessageSquare className="h-5 w-5 mb-3" />
            <h3 className="font-medium text-sm">GitHub Discussions</h3>
            <p className="text-sm text-muted-foreground mt-1">Open a discussion or report an issue</p>
          </a>
        </div>
      </div>
    </div>
  );
}

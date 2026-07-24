<button
      type="submit"
      disabled={isLoading}
      className="h-9 w-full inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Logging in...
        </>
      ) : (
        <>
          Log in
          <ArrowRight className="h-4 w-4 ml-2" />
        </>
      )}
    </button>
  </form>
  <script>
    const togglePassword = () => {
      const passwordField = document.getElementById("password-field");
      const input = passwordField?.querySelector("input");
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
      }
    };
  </script>
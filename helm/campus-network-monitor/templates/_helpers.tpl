{{- define "cnm.fullname" -}}
{{- printf "%s-%s" .Release.Name "cnm" -}}
{{- end -}}
